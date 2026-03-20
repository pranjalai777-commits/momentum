import { COLORS, GRADIENTS } from "@/constants/theme";
import { hapticAuthError, hapticAuthSuccess, hapticAuthTap } from "@/lib/haptics";
import { supabase } from "@/lib/supabase";
import { LinearGradient } from "expo-linear-gradient";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

type AuthMode = "signin" | "signup";

const PASSWORD_MIN_LENGTH = 6;

function getAuthErrorMessage(error: unknown): string {
  if (error instanceof TypeError && error.message === "Network request failed") {
    return "Unable to reach Supabase. Check internet, EXPO_PUBLIC_SUPABASE_URL, and try again.";
  }
  if (error instanceof Error) return error.message;
  return "Unexpected auth error. Please try again.";
}

// ── Animated input with neon focus glow ──────────────────────────────────────
function AnimatedInput({
  value,
  onChangeText,
  placeholder,
  autoCapitalize = "none",
  keyboardType = "default",
  secureTextEntry = false,
  enterDelay = 0,
  rightElement,
}: {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  keyboardType?: "default" | "email-address";
  secureTextEntry?: boolean;
  enterDelay?: number;
  rightElement?: React.ReactNode;
}) {
  const focusAnim = useSharedValue(0);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(16);

  useEffect(() => {
    const ease = Easing.out(Easing.exp);
    opacity.value = withDelay(enterDelay, withTiming(1, { duration: 500 }));
    translateY.value = withDelay(enterDelay, withTiming(0, { duration: 500, easing: ease }));
  }, [enterDelay]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
    borderColor: interpolateColor(focusAnim.value, [0, 1], [COLORS.border, COLORS.neonCyan]),
    shadowOpacity: focusAnim.value * 0.3,
  }));

  return (
    <Animated.View
      className="flex-row items-center h-[54px] rounded-lg border bg-card px-4"
      style={[
        containerStyle,
        { shadowColor: COLORS.neonCyan, shadowRadius: 14, shadowOffset: { width: 0, height: 0 } },
      ]}
    >
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.mutedForeground}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        onFocus={() => { focusAnim.value = withTiming(1, { duration: 250 }); }}
        onBlur={() => { focusAnim.value = withTiming(0, { duration: 200 }); }}
        className="flex-1 text-foreground font-sans text-[15px]"
      />
      {rightElement}
    </Animated.View>
  );
}

// ── Email auth screen ─────────────────────────────────────────────────────────
export default function EmailAuthScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string; upgrade?: string }>();
  const mode: AuthMode = params.mode === "signin" ? "signin" : "signup";
  const shouldPreferUpgrade = params.upgrade === "1";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const title = useMemo(() => (mode === "signin" ? "Welcome back" : "Create account"), [mode]);
  const subtitle = useMemo(
    () =>
      mode === "signin"
        ? "Pick up right where you left off."
        : "Save your progress with email and password.",
    [mode],
  );

  // Entrance animations
  const headerOpacity = useSharedValue(0);
  const headerTY = useSharedValue(24);
  const btnOpacity = useSharedValue(0);
  const btnTY = useSharedValue(20);

  useEffect(() => {
    const ease = Easing.out(Easing.exp);
    headerOpacity.value = withDelay(100, withTiming(1, { duration: 600 }));
    headerTY.value = withDelay(100, withTiming(0, { duration: 600, easing: ease }));
    btnOpacity.value = withDelay(700, withTiming(1, { duration: 500 }));
    btnTY.value = withDelay(700, withTiming(0, { duration: 500, easing: ease }));
  }, []);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTY.value }],
  }));
  const btnEnterStyle = useAnimatedStyle(() => ({
    opacity: btnOpacity.value,
    transform: [{ translateY: btnTY.value }],
  }));

  const validate = (): boolean => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) { setErrorMessage("Email is required."); hapticAuthError(); return false; }
    if (!trimmedEmail.includes("@")) { setErrorMessage("Enter a valid email address."); hapticAuthError(); return false; }
    if (!password) { setErrorMessage("Password is required."); hapticAuthError(); return false; }
    if (password.length < PASSWORD_MIN_LENGTH) {
      setErrorMessage(`Password must be at least ${PASSWORD_MIN_LENGTH} characters.`);
      hapticAuthError();
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    hapticAuthTap();
    setInfoMessage(null);
    setErrorMessage(null);
    if (!validate()) return;

    setIsSubmitting(true);
    const normalizedEmail = email.trim().toLowerCase();
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
        if (error) { setErrorMessage(error.message); hapticAuthError(); return; }
        hapticAuthSuccess();
        router.replace("/(app)");
        return;
      }

      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) { setErrorMessage(sessionError.message); hapticAuthError(); return; }

      let user = sessionData.session?.user ?? null;
      const shouldUseUpgradePath = mode === "signup" || shouldPreferUpgrade;
      if (shouldUseUpgradePath && !user) {
        const anonResult = await supabase.auth.signInAnonymously();
        if (anonResult.error) { setErrorMessage(anonResult.error.message); hapticAuthError(); return; }
        user = anonResult.data.user ?? anonResult.data.session?.user ?? null;
      }

      const canUpgradeAnonymous =
        shouldUseUpgradePath &&
        !!user &&
        (user.is_anonymous || user.app_metadata?.provider === "anonymous");

      if (canUpgradeAnonymous) {
        const { error: updateError } = await supabase.auth.updateUser({ email: normalizedEmail, password });
        if (updateError) { setErrorMessage(updateError.message); hapticAuthError(); return; }
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError) { setErrorMessage(userError.message); hapticAuthError(); return; }
        const upgradedUser = userData.user;
        if (!upgradedUser || upgradedUser.is_anonymous || upgradedUser.email !== normalizedEmail) {
          setErrorMessage("Account upgrade did not complete. Please try again.");
          hapticAuthError();
          return;
        }
        hapticAuthSuccess();
        router.replace("/(app)");
        return;
      }

      setErrorMessage("Unable to upgrade current session. Please tap Play Now first, then create account.");
      hapticAuthError();
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error));
      hapticAuthError();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back button */}
          <Pressable
            onPress={() => {
              hapticAuthTap();
              router.back();
            }}
            className="flex-row items-center gap-[6px] self-start py-1"
            style={({ pressed }) => pressed && { opacity: 0.5 }}
          >
            <Text className="text-muted-foreground text-[20px] leading-[20px]">←</Text>
            <Text className="text-muted-foreground font-sans-medium text-[14px]">Back</Text>
          </Pressable>

          <View style={{ flex: 1, justifyContent: "center", gap: 24 }}>
            {/* Header */}
            <Animated.View style={headerStyle} className="gap-2">
              <View className="flex-row items-center gap-2 mb-1">
                <View className="w-[7px] h-[7px] rounded-full bg-neon-cyan" />
                <Text className="text-neon-cyan font-display-medium text-[11px] tracking-[2.5px] uppercase">
                  Momentum
                </Text>
              </View>
              <Text className="text-foreground font-display text-[36px] leading-[42px]">{title}</Text>
              <Text className="text-muted-foreground font-sans text-[14px] leading-[20px]">{subtitle}</Text>
            </Animated.View>

            {/* Form inputs */}
            <View className="gap-3">
              <AnimatedInput
                value={email}
                onChangeText={setEmail}
                placeholder="Email address"
                keyboardType="email-address"
                enterDelay={300}
              />
              <AnimatedInput
                value={password}
                onChangeText={setPassword}
                placeholder="Password"
                secureTextEntry={!showPassword}
                enterDelay={420}
                rightElement={
                  <Pressable
                    onPress={() => {
                      hapticAuthTap();
                      setShowPassword((s) => !s);
                    }}
                    className="pl-3 py-1"
                    style={({ pressed }) => pressed && { opacity: 0.6 }}
                  >
                    <Text className="text-muted-foreground font-sans-medium text-[10px] tracking-[1.2px]">
                      {showPassword ? "HIDE" : "SHOW"}
                    </Text>
                  </Pressable>
                }
              />
            </View>

            {/* Submit button */}
            <Animated.View style={btnEnterStyle}>
              <Pressable
                disabled={isSubmitting}
                onPress={() => void handleSubmit()}
                className="rounded-xl overflow-hidden"
                style={({ pressed }) => [
                  {
                    shadowColor: COLORS.neonCyan,
                    shadowOpacity: 0.4,
                    shadowRadius: 18,
                    shadowOffset: { width: 0, height: 4 },
                    elevation: 8,
                  },
                  pressed && { opacity: 0.9 },
                  isSubmitting && { opacity: 0.6 },
                ]}
              >
                <LinearGradient
                  colors={GRADIENTS.cyanPurple}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ height: 58, borderRadius: 12, alignItems: "center", justifyContent: "center" }}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#041018" />
                  ) : (
                    <Text className="text-[#041018] font-display text-[17px] tracking-[0.5px]">
                      {mode === "signin" ? "Sign In" : "Create Account"}
                    </Text>
                  )}
                </LinearGradient>
              </Pressable>
            </Animated.View>

            {/* Error / info messages */}
            {errorMessage ? (
              <View
                className="rounded-md px-[14px] py-[10px]"
                style={{ backgroundColor: "rgba(255,26,179,0.07)", borderWidth: 1, borderColor: "rgba(255,26,179,0.22)" }}
              >
                <Text className="text-neon-pink font-sans text-[13px] leading-[18px]">{errorMessage}</Text>
              </View>
            ) : null}
            {infoMessage ? <Text className="text-neon-cyan font-sans text-[13px]">{infoMessage}</Text> : null}

            {/* Footer switch-mode link */}
            <View className="items-center mt-1">
              {mode === "signin" ? (
                <Link href="/(auth)/email?mode=signup" className="text-muted-foreground font-sans text-[14px]">
                  Don&apos;t have an account?{"  "}
                  <Text className="text-neon-cyan font-sans-medium">Create one →</Text>
                </Link>
              ) : (
                <Link href="/(auth)/email?mode=signin" className="text-muted-foreground font-sans text-[14px]">
                  Already have an account?{"  "}
                  <Text className="text-neon-cyan font-sans-medium">Sign in →</Text>
                </Link>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
