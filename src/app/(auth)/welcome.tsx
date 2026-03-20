import { COLORS, GRADIENTS } from "@/constants/theme";
import { useAuth } from "@/hooks/useAuth";
import { hapticAuthError, hapticAuthSuccess, hapticAuthTap } from "@/lib/haptics";
import { supabase } from "@/lib/supabase";
import * as Google from "expo-auth-session/providers/google";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Dimensions, Platform, Pressable, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

WebBrowser.maybeCompleteAuthSession();

const { width: SW, height: SH } = Dimensions.get("window");
const GRADIENT_BUTTON_STYLE = {
  alignItems: "center" as const,
  justifyContent: "center" as const,
  borderRadius: 12,
};

function getAuthErrorMessage(error: unknown): string {
  if (error instanceof TypeError && error.message === "Network request failed") {
    return "Unable to reach Supabase. Check internet, EXPO_PUBLIC_SUPABASE_URL, and try again.";
  }
  if (error instanceof Error) return error.message;
  return "Unexpected auth error. Please try again.";
}

// ── Animated neon glow orb ────────────────────────────────────────────────────
function GlowOrb({
  color,
  size,
  x,
  y,
  delay = 0,
  duration = 3600,
}: {
  color: string;
  size: number;
  x: number;
  y: number;
  delay?: number;
  duration?: number;
}) {
  const ty = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 900 }));
    ty.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-22, { duration, easing: Easing.inOut(Easing.ease) }),
          withTiming(22, { duration, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        true,
      ),
    );
    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1.12, { duration: Math.round(duration * 0.75), easing: Easing.inOut(Easing.ease) }),
          withTiming(0.88, { duration: Math.round(duration * 0.75), easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        true,
      ),
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: ty.value }, { scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        { position: "absolute", left: x, top: y, width: size, height: size, alignItems: "center", justifyContent: "center" },
        animStyle,
      ]}
    >
      <View style={{ position: "absolute", width: size, height: size, borderRadius: size / 2, backgroundColor: color, opacity: 0.045 }} />
      <View style={{ position: "absolute", width: size * 0.6, height: size * 0.6, borderRadius: size * 0.3, backgroundColor: color, opacity: 0.09 }} />
      <View style={{ position: "absolute", width: size * 0.32, height: size * 0.32, borderRadius: size * 0.16, backgroundColor: color, opacity: 0.4 }} />
    </Animated.View>
  );
}

// ── Google sign-in (logic unchanged, new social button style) ─────────────────
type GoogleSignInButtonProps = {
  clientId: string;
  disabled: boolean;
  onBusyChange: (busy: boolean) => void;
  onError: (message: string) => void;
  onSuccess: () => void;
};

function GoogleSignInButton({ clientId, disabled, onBusyChange, onError, onSuccess }: GoogleSignInButtonProps) {
  const googleConfig = useMemo(() => {
    if (Platform.OS === "ios") return { iosClientId: clientId };
    if (Platform.OS === "android") return { androidClientId: clientId };
    return { webClientId: clientId };
  }, [clientId]);

  const [, googleResponse, promptGoogleSignIn] = Google.useIdTokenAuthRequest(googleConfig);

  useEffect(() => {
    const completeGoogleSignIn = async () => {
      if (!googleResponse) return;
      if (googleResponse.type !== "success") {
        if (googleResponse.type === "error") onError(googleResponse.error?.message ?? "Google sign-in failed.");
        onBusyChange(false);
        return;
      }
      const idToken = googleResponse.params.id_token;
      if (!idToken) { onError("Google sign-in failed: missing ID token."); onBusyChange(false); return; }
      try {
        const { error } = await supabase.auth.signInWithIdToken({ provider: "google", token: idToken });
        if (error) { onError(error.message); onBusyChange(false); return; }
      } catch (error) {
        onError(getAuthErrorMessage(error)); onBusyChange(false); return;
      }
      onSuccess();
    };
    void completeGoogleSignIn();
  }, [googleResponse, onBusyChange, onError, onSuccess]);

  const handleGooglePress = async () => {
    hapticAuthTap();
    onBusyChange(true);
    try {
      const response = await promptGoogleSignIn();
      if (response.type === "dismiss" || response.type === "cancel") onBusyChange(false);
    } catch (error) {
      onError(getAuthErrorMessage(error)); onBusyChange(false);
    }
  };

  return (
    <Pressable
      onPress={() => void handleGooglePress()}
      disabled={disabled}
      className="flex-1 flex-row items-center justify-center gap-2 h-[52px] rounded-lg border border-border bg-card"
      style={({ pressed }) => pressed && { opacity: 0.75, transform: [{ scale: 0.97 }] }}
    >
      <Text className="text-foreground font-sans-bold text-[16px]">G</Text>
      <Text className="text-foreground font-sans-medium text-[14px]">{disabled ? "Connecting…" : "Google"}</Text>
    </Pressable>
  );
}

// ── Welcome screen ────────────────────────────────────────────────────────────
export default function WelcomeScreen() {
  const router = useRouter();
  const { isLoading, session } = useAuth();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<"anon" | "apple" | "google" | null>(null);

  const googleClientId = useMemo(() => {
    if (Platform.OS === "ios") return process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? "";
    if (Platform.OS === "android") return process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? "";
    return process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? "";
  }, []);

  // Entrance animation values
  const brandOpacity = useSharedValue(0);
  const brandTY = useSharedValue(36);
  const taglineOpacity = useSharedValue(0);
  const taglineTY = useSharedValue(22);
  const actionsOpacity = useSharedValue(0);
  const actionsTY = useSharedValue(56);
  const btnScale = useSharedValue(1);

  useEffect(() => {
    if (session) router.replace("/(app)");
  }, [router, session]);

  useEffect(() => {
    const ease = Easing.out(Easing.exp);
    brandOpacity.value = withDelay(150, withTiming(1, { duration: 700 }));
    brandTY.value = withDelay(150, withTiming(0, { duration: 700, easing: ease }));
    taglineOpacity.value = withDelay(380, withTiming(1, { duration: 600 }));
    taglineTY.value = withDelay(380, withTiming(0, { duration: 600, easing: ease }));
    actionsOpacity.value = withDelay(580, withTiming(1, { duration: 600 }));
    actionsTY.value = withDelay(580, withTiming(0, { duration: 600, easing: ease }));
    // Breathing pulse on PLAY NOW button
    btnScale.value = withDelay(
      1400,
      withRepeat(
        withSequence(
          withTiming(1.028, { duration: 1600, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.972, { duration: 1600, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        true,
      ),
    );
  }, []);

  const brandStyle = useAnimatedStyle(() => ({ opacity: brandOpacity.value, transform: [{ translateY: brandTY.value }] }));
  const taglineStyle = useAnimatedStyle(() => ({ opacity: taglineOpacity.value, transform: [{ translateY: taglineTY.value }] }));
  const actionsStyle = useAnimatedStyle(() => ({ opacity: actionsOpacity.value, transform: [{ translateY: actionsTY.value }] }));
  const btnPulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: btnScale.value }] }));

  const handlePlayNow = async () => {
    hapticAuthTap();
    setErrorMessage(null);
    setBusyAction("anon");
    try {
      const { error } = await supabase.auth.signInAnonymously();
      if (error) { setErrorMessage(error.message); hapticAuthError(); setBusyAction(null); return; }
      hapticAuthSuccess();
      router.replace("/(app)");
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error));
      hapticAuthError();
      setBusyAction(null);
    }
  };

  const handleAppleSignIn = async () => {
    hapticAuthTap();
    setErrorMessage(null);
    setBusyAction("apple");
    if (Platform.OS !== "ios") {
      setErrorMessage("Apple Sign-In is only available on iOS devices.");
      hapticAuthError();
      setBusyAction(null);
      return;
    }
    let AppleAuthentication: typeof import("expo-apple-authentication");
    try {
      AppleAuthentication = await import("expo-apple-authentication");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Apple Sign-In is unavailable in this build.");
      hapticAuthError();
      setBusyAction(null);
      return;
    }
    try {
      const isAvailable = await AppleAuthentication.isAvailableAsync();
      if (!isAvailable) { setErrorMessage("Apple Sign-In is unavailable on this device."); hapticAuthError(); setBusyAction(null); return; }
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        ],
      });
      if (!credential.identityToken) { setErrorMessage("Apple sign-in failed: missing identity token."); hapticAuthError(); setBusyAction(null); return; }
      const { error } = await supabase.auth.signInWithIdToken({ provider: "apple", token: credential.identityToken });
      if (error) { setErrorMessage(error.message); hapticAuthError(); setBusyAction(null); return; }
      hapticAuthSuccess();
      router.replace("/(app)");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Apple sign-in was cancelled.";
      setErrorMessage(message === "Network request failed" ? getAuthErrorMessage(new TypeError(message)) : message);
      hapticAuthError();
      setBusyAction(null);
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center gap-3">
        <ActivityIndicator color={COLORS.neonCyan} size="large" />
        <Text className="text-muted-foreground font-sans text-[14px]">Loading…</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      {/* Animated background orbs */}
      <GlowOrb color={COLORS.neonCyan}   size={300} x={-90}      y={-70}       delay={0}   duration={4400} />
      <GlowOrb color={COLORS.neonPurple} size={230} x={SW - 150} y={SH * 0.14} delay={350} duration={3800} />
      <GlowOrb color={COLORS.neonPink}   size={190} x={-20}      y={SH * 0.5}  delay={650} duration={5000} />
      <GlowOrb color={COLORS.neonCyan}   size={150} x={SW - 100} y={SH * 0.62} delay={950} duration={3300} />

      <SafeAreaView className="flex-1">
        {/* ── Hero / brand section ── */}
        <View className="flex-1 px-7 pt-9 justify-center gap-5">
          <Animated.View style={brandStyle}>
            <View className="flex-row items-center gap-2 mb-2">
              <View className="w-[7px] h-[7px] rounded-full bg-neon-cyan" />
              <Text className="text-neon-cyan font-display-medium text-[11px] tracking-[2.8px] uppercase">
                Build your streak
              </Text>
            </View>
            <Text
              className="text-foreground font-display text-[54px] leading-[58px]"
              style={{
                shadowColor: COLORS.neonCyan,
                shadowOpacity: 0.2,
                shadowRadius: 28,
                shadowOffset: { width: 0, height: 0 },
              }}
            >
              MOMENTUM
            </Text>
          </Animated.View>

          <Animated.View style={taglineStyle}>
            <Text className="text-foreground font-display-medium text-[22px] leading-[30px] mb-[10px]">
              Tiny wins.{"\n"}Massive momentum.
            </Text>
            <Text className="text-muted-foreground font-sans text-[14px] leading-[22px]">
              Build streaks, earn XP, and lock in{"\n"}focus sessions with a single tap.
            </Text>
          </Animated.View>
        </View>

        {/* ── Actions section ── */}
        <Animated.View style={actionsStyle} className="px-5 pb-7 gap-3">
          {/* PLAY NOW — pulsing gradient CTA */}
          <Animated.View style={btnPulseStyle}>
            <Pressable
              onPress={() => void handlePlayNow()}
              disabled={busyAction !== null}
              className="rounded-xl overflow-hidden"
              style={({ pressed }) => [
                {
                  shadowColor: COLORS.neonCyan,
                  shadowOpacity: 0.5,
                  shadowRadius: 24,
                  shadowOffset: { width: 0, height: 6 },
                  elevation: 12,
                },
                pressed && { opacity: 0.88 },
              ]}
            >
              <LinearGradient
                colors={GRADIENTS.cyanPurple}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[GRADIENT_BUTTON_STYLE, { height: 70, gap: 3 }]}
              >
                {busyAction === "anon" ? (
                  <ActivityIndicator color="#041018" />
                ) : (
                  <>
                    <Text className="text-[#041018] font-display text-[18px] tracking-[1.6px]">⚡  PLAY NOW</Text>
                    <Text className="text-[#041018] font-sans-medium text-[11px] opacity-60">No sign-up required</Text>
                  </>
                )}
              </LinearGradient>
            </Pressable>
          </Animated.View>

          {/* Sign In / Create Account side-by-side */}
          <View className="flex-row rounded-lg border border-border bg-card overflow-hidden h-[52px]">
              <Pressable
                onPress={() => {
                  hapticAuthTap();
                  router.push("/(auth)/email?mode=signin");
                }}
                disabled={busyAction !== null}
                className="flex-1 items-center justify-center"
                style={({ pressed }) => pressed && { opacity: 0.7, transform: [{ scale: 0.97 }] }}
            >
              <Text className="text-foreground font-display-medium text-[14px]">Sign In</Text>
            </Pressable>
            <View className="w-[1px] bg-border my-[10px]" />
              <Pressable
                onPress={() => {
                  hapticAuthTap();
                  router.push("/(auth)/email?mode=signup");
                }}
                disabled={busyAction !== null}
                className="flex-1 items-center justify-center"
                style={({ pressed }) => pressed && { opacity: 0.7, transform: [{ scale: 0.97 }] }}
            >
              <Text className="text-foreground font-display-medium text-[14px]">Create Account</Text>
            </Pressable>
          </View>

          {/* OR divider */}
          <View className="flex-row items-center gap-[10px] my-[2px]">
            <View className="flex-1 h-[1px] bg-border" />
            <Text className="text-muted-foreground font-sans-medium text-[10px] tracking-[2px]">OR</Text>
            <View className="flex-1 h-[1px] bg-border" />
          </View>

          {/* Social auth row */}
          <View className="flex-row gap-[10px]">
            {Platform.OS === "ios" && (
              <Pressable
                onPress={() => void handleAppleSignIn()}
                disabled={busyAction !== null}
                className="flex-1 flex-row items-center justify-center gap-2 h-[52px] rounded-lg border border-border bg-card"
                style={({ pressed }) => pressed && { opacity: 0.75, transform: [{ scale: 0.97 }] }}
              >
                <Text className="text-foreground font-sans-bold text-[17px]"></Text>
                <Text className="text-foreground font-sans-medium text-[14px]">
                  {busyAction === "apple" ? "Connecting…" : "Apple"}
                </Text>
              </Pressable>
            )}
            {googleClientId ? (
              <GoogleSignInButton
                clientId={googleClientId}
                disabled={busyAction !== null}
                onBusyChange={(busy) => setBusyAction(busy ? "google" : null)}
                onError={(message) => {
                  setErrorMessage(message);
                  hapticAuthError();
                }}
                onSuccess={() => {
                  hapticAuthSuccess();
                  router.replace("/(app)");
                }}
              />
            ) : (
              <Pressable
                onPress={() => {
                  hapticAuthTap();
                  setErrorMessage(
                    Platform.OS === "ios"
                      ? "Google auth missing EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID."
                      : Platform.OS === "android"
                        ? "Google auth missing EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID."
                        : "Google auth missing EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID.",
                  );
                  hapticAuthError();
                }}
                className="flex-1 flex-row items-center justify-center gap-2 h-[52px] rounded-lg border border-border bg-card"
                style={({ pressed }) => pressed && { opacity: 0.75, transform: [{ scale: 0.97 }] }}
              >
                <Text className="text-foreground font-sans-bold text-[16px]">G</Text>
                <Text className="text-foreground font-sans-medium text-[14px]">Google</Text>
              </Pressable>
            )}
          </View>

          {/* Error message */}
          {errorMessage ? (
            <View
              className="rounded-md px-[14px] py-[10px]"
              style={{ backgroundColor: "rgba(255,26,179,0.07)", borderWidth: 1, borderColor: "rgba(255,26,179,0.22)" }}
            >
              <Text className="text-neon-pink font-sans text-[13px] leading-[18px]">{errorMessage}</Text>
            </View>
          ) : null}
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}
