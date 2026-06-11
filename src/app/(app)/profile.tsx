import { COLORS } from "@/constants/theme";
import ScalePressable from "@/components/ui/ScalePressable";
import { useAuth } from "@/hooks/useAuth";
import { useRevenueCat } from "@/hooks/useRevenueCat";
import { supabase } from "@/lib/supabase";
import { useGameStore } from "@/store/useGameStore";
import { useNoAdsStore } from "@/store/useNoAdsStore";
import { useTaskStore } from "@/store/useTaskStore";
import { useRouter } from "expo-router";
import { useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const DELETE_CONFIRMATION_TEXT = "DELETE";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, isAnonymous } = useAuth();
  const resetGameStore = useGameStore((s) => s.reset);
  const resetTaskStore = useTaskStore((s) => s.reset);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const noAds = useNoAdsStore((s) => s.noAds);
  const { purchaseRemoveAds, restorePurchases, isPurchasing, isRestoring, error: rcError } = useRevenueCat();

  const canDelete = useMemo(
    () => deleteInput.trim().toUpperCase() === DELETE_CONFIRMATION_TEXT,
    [deleteInput]
  );
  const canShowDeleteAccount = !!user && !isAnonymous;

  const handleRemoveAds = async () => {
    const success = await purchaseRemoveAds();
    if (success) {
      Alert.alert("🎉 Ads Removed!", "You'll no longer see ads in Momentum. Thank you for your support!");
    }
  };

  const handleRestorePurchases = async () => {
    const found = await restorePurchases();
    if (found) {
      Alert.alert("✅ Purchase Restored", "Your Remove Ads purchase has been restored.");
    } else {
      Alert.alert("No Purchase Found", "We couldn't find a Remove Ads purchase for this account.");
    }
  };

  const handleBack = () => {
    router.back();
  };

  const cleanupLocalState = () => {
    resetTaskStore();
    resetGameStore();
  };

  const handleLogout = async () => {
    setErrorMessage(null);
    setIsLoggingOut(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      setErrorMessage(error.message);
      setIsLoggingOut(false);
      return;
    }
    cleanupLocalState();
    setIsLoggingOut(false);
  };

  const executeAccountDeletion = async () => {
    setErrorMessage(null);
    setIsDeletingAccount(true);
    const { error } = await supabase.rpc("delete_my_account");
    if (error) {
      setErrorMessage(error.message);
      setIsDeletingAccount(false);
      return;
    }

    cleanupLocalState();
    const signOutResult = await supabase.auth.signOut();
    if (signOutResult.error) {
      setErrorMessage(signOutResult.error.message);
      setIsDeletingAccount(false);
      return;
    }

    setIsDeletingAccount(false);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete account permanently?",
      "This will remove your profile, tasks, XP history, and all progress forever. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => void executeAccountDeletion() },
      ]
    );
  };

  return (
    <ScrollView
      ref={scrollRef}
      style={{ flex: 1, backgroundColor: COLORS.background }}
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingTop: insets.top + 10,
        paddingBottom: insets.bottom + 120,
        gap: 14,
      }}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
    >
      <View className="flex-row items-center justify-between">
        <Pressable onPress={handleBack} className="px-3 py-[6px] rounded-full border border-border bg-card">
          <Text className="text-muted-foreground font-sans text-[12px]">Back</Text>
        </Pressable>
        <Text className="text-neon-cyan font-display text-[22px]">PROFILE</Text>
        <View style={{ width: 58 }} />
      </View>

      <View className="rounded-[18px] border border-border bg-card-elevated px-4 py-4 gap-2">
        <Text className="text-muted-foreground font-sans text-[12px] uppercase tracking-[1px]">Account</Text>
        <Text className="text-foreground font-display text-[20px]">
          {isAnonymous ? "Guest Session" : "Signed In"}
        </Text>
        <Text className="text-muted-foreground font-sans text-[13px]">
          {user?.email ? user.email : "No email linked"}
        </Text>
        <Text className="text-muted-foreground font-sans text-[12px]">
          User ID: {user?.id ?? "Not available"}
        </Text>
      </View>

      <View className="rounded-[18px] border border-border bg-card-elevated px-4 py-4 gap-3">
        <View className="flex-row items-center justify-between">
          <Text className="text-muted-foreground font-sans text-[12px] uppercase tracking-[1px]">Momentum Pro</Text>
          {noAds ? (
            <View className="px-2 py-[3px] rounded-full bg-neon-cyan/20 border border-neon-cyan/40">
              <Text className="text-neon-cyan font-sans text-[11px]">Active</Text>
            </View>
          ) : null}
        </View>
        {noAds ? (
          <>
            <Text className="text-foreground font-display text-[18px]">Ads Removed ✨</Text>
            <Text className="text-muted-foreground font-sans text-[13px] leading-5">
              You're on Momentum Pro — enjoy an ad-free experience forever.
            </Text>
          </>
        ) : (
          <>
            <Text className="text-foreground font-display text-[18px]">Remove Ads</Text>
            <Text className="text-muted-foreground font-sans text-[13px] leading-5">
              One-time purchase. Remove all ads from Momentum forever and support development.
            </Text>
            <ScalePressable
              onPress={() => void handleRemoveAds()}
              disabled={isPurchasing || isRestoring}
              className="h-[50px] rounded-[14px] items-center justify-center"
              style={{ backgroundColor: COLORS.neonCyan, opacity: isPurchasing ? 0.7 : 1 }}
              pressedStyle={{ transform: [{ scale: 0.98 }] }}
            >
              {isPurchasing ? (
                <ActivityIndicator color={COLORS.background} />
              ) : (
                <Text style={{ color: COLORS.background }} className="font-display-medium text-[15px]">
                  Remove Ads — $2.99
                </Text>
              )}
            </ScalePressable>
            <Pressable
              onPress={() => void handleRestorePurchases()}
              disabled={isPurchasing || isRestoring}
              className="h-[40px] items-center justify-center"
            >
              {isRestoring ? (
                <ActivityIndicator color={COLORS.mutedForeground} size="small" />
              ) : (
                <Text className="text-muted-foreground font-sans text-[13px]">Restore Purchase</Text>
              )}
            </Pressable>
            {rcError ? (
              <Text className="text-neon-pink font-sans text-[12px]">{rcError}</Text>
            ) : null}
          </>
        )}
      </View>

      <View className="rounded-[18px] border border-border bg-card-elevated px-4 py-4 gap-3">
        <Text className="text-muted-foreground font-sans text-[12px] uppercase tracking-[1px]">Session</Text>
        <Text className="text-muted-foreground font-sans text-[13px] leading-5">
          Log out to end this session on this device. You can sign back in anytime.
        </Text>
        <ScalePressable
          onPress={() => void handleLogout()}
          disabled={isLoggingOut || isDeletingAccount}
          className="h-[50px] rounded-[14px] items-center justify-center border border-border bg-muted"
          pressedStyle={{ transform: [{ scale: 0.98 }] }}
        >
          {isLoggingOut ? (
            <ActivityIndicator color={COLORS.foreground} />
          ) : (
            <Text className="text-foreground font-display-medium text-[15px]">Log out</Text>
          )}
        </ScalePressable>
      </View>

      {canShowDeleteAccount ? (
        <View className="rounded-[18px] border border-neon-pink bg-card-elevated px-4 py-4 gap-3">
          <Text className="text-neon-pink font-sans text-[12px] uppercase tracking-[1px]">Danger zone</Text>
          <Text className="text-foreground font-display text-[18px]">Delete account</Text>
          <Text className="text-muted-foreground font-sans text-[13px] leading-5">
            This permanently deletes your account and all data. To continue, type{" "}
            <Text className="text-neon-pink font-sans-bold">{DELETE_CONFIRMATION_TEXT}</Text>.
          </Text>
          <TextInput
            value={deleteInput}
            onChangeText={setDeleteInput}
            placeholder={`Type ${DELETE_CONFIRMATION_TEXT}`}
            placeholderTextColor={COLORS.mutedForeground}
            autoCapitalize="characters"
            className="h-[48px] rounded-[12px] border border-border bg-card px-3 text-foreground"
            editable={!isDeletingAccount && !isLoggingOut}
            onFocus={() => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 350)}
          />
          <ScalePressable
            onPress={handleDeleteAccount}
            disabled={!canDelete || isDeletingAccount || isLoggingOut}
            className="h-[50px] rounded-[14px] items-center justify-center"
            style={{
              backgroundColor: canDelete ? COLORS.neonPink : COLORS.borderSubtle,
              opacity: canDelete ? 1 : 0.6,
            }}
            pressedStyle={canDelete ? { transform: [{ scale: 0.98 }] } : null}
          >
            {isDeletingAccount ? (
              <ActivityIndicator color={COLORS.foreground} />
            ) : (
              <Text className="text-foreground font-display-medium text-[15px]">Delete my account</Text>
            )}
          </ScalePressable>
        </View>
      ) : null}

      {errorMessage ? (
        <View className="rounded-[12px] border border-neon-pink bg-card px-[10px] py-[8px]">
          <Text className="text-neon-pink font-sans text-[12px]">{getErrorMessage(errorMessage)}</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}
