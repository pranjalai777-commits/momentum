import { COLORS } from "@/constants/theme";
import { useAuth } from "@/hooks/useAuth";
import { useRevenueCat } from "@/hooks/useRevenueCat";
import { supabase } from "@/lib/supabase";
import { useGameStore } from "@/store/useGameStore";
import { useNoAdsStore } from "@/store/useNoAdsStore";
import { useTaskStore } from "@/store/useTaskStore";
import { User, X, LogOut, Trash2, Shield } from "lucide-react-native";
import { useMemo, useRef, useState, useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const DELETE_CONFIRMATION_TEXT = "DELETE";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}

type ProfileModalProps = {
  visible: boolean;
  onClose: () => void;
  onUpgradeAccount?: () => void;
};

export default function ProfileModal({ visible, onClose, onUpgradeAccount }: ProfileModalProps) {
  const insets = useSafeAreaInsets();
  const { user, isAnonymous } = useAuth();
  const resetGameStore = useGameStore((s) => s.reset);
  const resetTaskStore = useTaskStore((s) => s.reset);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const [keyboardOffset, setKeyboardOffset] = useState(0);

  const noAds = useNoAdsStore((s) => s.noAds);
  const { purchaseRemoveAds, restorePurchases, isPurchasing, isRestoring, error: rcError } = useRevenueCat();

  const handleRemoveAds = async () => {
    const success = await purchaseRemoveAds();
    if (success) Alert.alert("🎉 Ads Removed!", "You'll no longer see ads in Momentum. Thank you for your support!");
  };

  const handleRestorePurchases = async () => {
    const found = await restorePurchases();
    if (found) Alert.alert("✅ Purchase Restored", "Your Remove Ads purchase has been restored.");
    else Alert.alert("No Purchase Found", "We couldn't find a Remove Ads purchase for this account.");
  };

  useEffect(() => {
    const show = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e) => setKeyboardOffset(e.endCoordinates.height)
    );
    const hide = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => setKeyboardOffset(0)
    );
    return () => { show.remove(); hide.remove(); };
  }, []);

  const canDelete = useMemo(
    () => deleteInput.trim().toUpperCase() === DELETE_CONFIRMATION_TEXT,
    [deleteInput]
  );
  const canShowDeleteAccount = !!user && !isAnonymous;

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
    onClose();
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
    onClose();
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

  const handleClose = () => {
    setDeleteInput("");
    setErrorMessage(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={{ flex: 1 }}>
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(8,9,13,0.70)" }}
          onPress={handleClose}
        />
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            marginBottom: keyboardOffset,
            backgroundColor: COLORS.background,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            borderTopWidth: 1,
            borderColor: COLORS.border,
            maxHeight: "85%",
          }}
        >
          {/* Handle bar */}
          <View style={{ alignItems: "center", paddingTop: 12, paddingBottom: 4 }}>
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: COLORS.border }} />
          </View>

          <ScrollView
            ref={scrollRef}
            style={{ flex: 1 }}
            showsVerticalScrollIndicator
            indicatorStyle="white"
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: Math.max(40, insets.bottom + 24) }}
          >
            {/* Header */}
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 12, marginBottom: 20 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <User size={18} color={COLORS.neonCyan} />
                <Text style={{ fontFamily: "SpaceGrotesk_700Bold", fontSize: 18, color: COLORS.foreground }}>
                  Profile
                </Text>
              </View>
              <Pressable
                onPress={handleClose}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: COLORS.cardElevated,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={14} color={COLORS.mutedForeground} />
              </Pressable>
            </View>

            {/* Account info */}
            <View
              style={{
                borderRadius: 18,
                borderWidth: 1,
                borderColor: COLORS.border,
                backgroundColor: COLORS.cardElevated,
                padding: 16,
                gap: 6,
                marginBottom: 12,
              }}
            >
              <Text style={{ color: COLORS.mutedForeground, fontFamily: "Inter_400Regular", fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }}>
                Account
              </Text>
              <Text style={{ color: COLORS.foreground, fontFamily: "SpaceGrotesk_700Bold", fontSize: 20 }}>
                {isAnonymous ? "Guest Session" : "Signed In"}
              </Text>
              <Text style={{ color: COLORS.mutedForeground, fontFamily: "Inter_400Regular", fontSize: 13 }}>
                {user?.email ? user.email : "No email linked"}
              </Text>
              <Text style={{ color: COLORS.mutedForeground, fontFamily: "Inter_400Regular", fontSize: 11 }}>
                User ID: {user?.id ?? "Not available"}
              </Text>

              {isAnonymous && onUpgradeAccount && (
                <Pressable
                  onPress={() => { handleClose(); onUpgradeAccount(); }}
                  style={({ pressed }) => ({
                    marginTop: 8,
                    height: 44,
                    borderRadius: 12,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: COLORS.neonCyan + "22",
                    borderWidth: 1,
                    borderColor: COLORS.neonCyan + "55",
                    opacity: pressed ? 0.8 : 1,
                  })}
                >
                  <Text style={{ color: COLORS.neonCyan, fontFamily: "SpaceGrotesk_600SemiBold", fontSize: 13 }}>
                    Link Account to Save Progress
                  </Text>
                </Pressable>
              )}
            </View>

            {/* Remove Ads / Momentum Pro — signed-in users only */}
            {!isAnonymous && (
            <View style={{ borderRadius: 18, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.cardElevated, padding: 16, gap: 10, marginBottom: 12 }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <Text style={{ color: COLORS.mutedForeground, fontFamily: "Inter_400Regular", fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }}>
                  Momentum Pro
                </Text>
                {noAds && (
                  <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99, backgroundColor: COLORS.neonCyan + "22", borderWidth: 1, borderColor: COLORS.neonCyan + "44" }}>
                    <Text style={{ color: COLORS.neonCyan, fontFamily: "Inter_400Regular", fontSize: 11 }}>Active</Text>
                  </View>
                )}
              </View>
              {noAds ? (
                <>
                  <Text style={{ color: COLORS.foreground, fontFamily: "SpaceGrotesk_700Bold", fontSize: 17 }}>Ads Removed ✨</Text>
                  <Text style={{ color: COLORS.mutedForeground, fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 20 }}>
                    You're on Momentum Pro — enjoy an ad-free experience forever.
                  </Text>
                </>
              ) : (
                <>
                  <Text style={{ color: COLORS.foreground, fontFamily: "SpaceGrotesk_700Bold", fontSize: 17 }}>Remove Ads</Text>
                  <Text style={{ color: COLORS.mutedForeground, fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 20 }}>
                    One-time purchase. Remove all ads from Momentum forever.
                  </Text>
                  <Pressable
                    onPress={() => void handleRemoveAds()}
                    disabled={isPurchasing || isRestoring}
                    style={({ pressed }) => ({ height: 50, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.neonCyan, opacity: isPurchasing ? 0.7 : pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] })}
                  >
                    {isPurchasing ? <ActivityIndicator color="#fff" /> : (
                      <Text style={{ color: "#fff", fontFamily: "SpaceGrotesk_700Bold", fontSize: 15 }}>Remove Ads — $2.99</Text>
                    )}
                  </Pressable>
                  {rcError ? <Text style={{ color: COLORS.neonPink, fontFamily: "Inter_400Regular", fontSize: 12 }}>{rcError}</Text> : null}
                </>
              )}
            </View>
            )}

            {/* Danger zone */}
            {canShowDeleteAccount ? (
              <View
                style={{
                  borderRadius: 18,
                  borderWidth: 1,
                  borderColor: COLORS.neonPink,
                  backgroundColor: COLORS.cardElevated,
                  padding: 16,
                  gap: 10,
                  marginBottom: 12,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Shield size={13} color={COLORS.neonPink} />
                  <Text style={{ color: COLORS.neonPink, fontFamily: "Inter_400Regular", fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }}>
                    Danger zone
                  </Text>
                </View>
                <Text style={{ color: COLORS.foreground, fontFamily: "SpaceGrotesk_700Bold", fontSize: 18 }}>
                  Delete account
                </Text>
                <Text style={{ color: COLORS.mutedForeground, fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 20 }}>
                  This permanently deletes your account and all data. To continue, type{" "}
                  <Text style={{ color: COLORS.neonPink, fontFamily: "Inter_700Bold" }}>{DELETE_CONFIRMATION_TEXT}</Text>.
                </Text>
                <TextInput
                  value={deleteInput}
                  onChangeText={setDeleteInput}
                  placeholder={`Type ${DELETE_CONFIRMATION_TEXT}`}
                  placeholderTextColor={COLORS.mutedForeground}
                  autoCapitalize="characters"
                  editable={!isDeletingAccount && !isLoggingOut}
                  onFocus={() => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300)}
                  style={{
                    height: 48,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: COLORS.border,
                    backgroundColor: COLORS.card,
                    paddingHorizontal: 12,
                    color: COLORS.foreground,
                    fontFamily: "Inter_400Regular",
                    fontSize: 14,
                  }}
                />
                <Pressable
                  onPress={handleDeleteAccount}
                  disabled={!canDelete || isDeletingAccount || isLoggingOut}
                  style={({ pressed }) => ({
                    height: 50,
                    borderRadius: 14,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: canDelete ? COLORS.neonPink : COLORS.borderSubtle,
                    opacity: canDelete ? (pressed ? 0.85 : 1) : 0.6,
                    transform: [{ scale: pressed && canDelete ? 0.98 : 1 }],
                  })}
                >
                  {isDeletingAccount ? (
                    <ActivityIndicator color={COLORS.foreground} />
                  ) : (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Trash2 size={14} color={COLORS.foreground} />
                      <Text style={{ color: COLORS.foreground, fontFamily: "SpaceGrotesk_600SemiBold", fontSize: 15 }}>
                        Delete my account
                      </Text>
                    </View>
                  )}
                </Pressable>
              </View>
            ) : null}

            {/* Session / Logout */}
            <View
              style={{
                borderRadius: 18,
                borderWidth: 1,
                borderColor: COLORS.border,
                backgroundColor: COLORS.cardElevated,
                padding: 16,
                gap: 10,
                marginBottom: 12,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <LogOut size={13} color={COLORS.mutedForeground} />
                <Text style={{ color: COLORS.mutedForeground, fontFamily: "Inter_400Regular", fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }}>
                  Session
                </Text>
              </View>
              <Text style={{ color: COLORS.mutedForeground, fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 20 }}>
                Log out to end this session on this device. You can sign back in anytime.
              </Text>
              <Pressable
                onPress={() => void handleLogout()}
                disabled={isLoggingOut || isDeletingAccount}
                style={({ pressed }) => ({
                  height: 50,
                  borderRadius: 14,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  backgroundColor: COLORS.muted,
                  opacity: pressed ? 0.8 : 1,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                })}
              >
                {isLoggingOut ? (
                  <ActivityIndicator color={COLORS.foreground} />
                ) : (
                  <Text style={{ color: COLORS.foreground, fontFamily: "SpaceGrotesk_600SemiBold", fontSize: 15 }}>
                    Log out
                  </Text>
                )}
              </Pressable>
            </View>

            {/* Error message */}
            {errorMessage ? (
              <View
                style={{
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: COLORS.neonPink,
                  backgroundColor: COLORS.card,
                  paddingHorizontal: 10,
                  paddingVertical: 8,
                }}
              >
                <Text style={{ color: COLORS.neonPink, fontFamily: "Inter_400Regular", fontSize: 12 }}>
                  {getErrorMessage(errorMessage)}
                </Text>
              </View>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
