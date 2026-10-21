import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, Platform, ActivityIndicator, Keyboard } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useChatBot } from '../context/ChatBotContext';
import { findAnswer } from '../data/nailKnowledge';

const CHAT_API_URL = 'http://localhost:5000/api/chat';

export default function ChatBotPanel() {
  const { colors } = useTheme();
  const { t, language, setLanguage } = useLanguage();
  const { open, setOpen, messages, addMessage, hasGreeted, setHasGreeted } = useChatBot();
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const scrollRef = useRef(null);
  const styles = makeStyles(colors);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    if (open && !hasGreeted) {
      addMessage('bot', t('chatbot_greeting'));
      setHasGreeted(true);
    }
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages, thinking]);

  const respond = async (question) => {
    addMessage('user', question);
    setThinking(true);

    try {
      const res = await fetch(CHAT_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: question, language }),
      });
      const data = await res.json();
      if (data.answer) {
        addMessage('bot', data.answer);
      } else {
        throw new Error('No answer field in response: ' + JSON.stringify(data));
      }
    } catch (err) {
      console.log('CHATBOT: falling back to offline answers because:', err.message);
      const fallback = findAnswer(question, language);
      addMessage('bot', fallback || t('chatbot_offtopic'));
    } finally {
      setThinking(false);
    }
  };

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    respond(trimmed);
    setInput('');
  };

    const quickQuestions = [
      t('chatbot_quick_nav_1'),
      t('chatbot_quick_nav_2'),
      t('chatbot_quick_nav_3'),
      t('chatbot_quick_nav_4'),
      t('chatbot_quick_1'),
      t('chatbot_quick_2'),
      t('chatbot_quick_3'),
      t('chatbot_quick_4'),
      t('chatbot_quick_5'),
    ];

  if (!open) return null;

  return (
    <View style={styles.overlayRoot}>
      <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />

    <View style={[styles.sheet, { marginBottom: Math.min(keyboardHeight, 260) }]}>        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.avatar}>
              <View style={styles.face}>
                <View style={styles.eye} />
                <View style={styles.eye} />
              </View>
              <View style={styles.smile} />
            </View>
            <View>
              <Text style={styles.title}>{t('chatbot_title')}</Text>
              <Text style={styles.subtitle}>{t('chatbot_subtitle')}</Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            <View style={styles.langSwitch}>
              <Pressable
                style={[styles.langPill, language === 'en' && styles.langPillActive]}
                onPress={() => setLanguage('en')}
              >
                <Text style={[styles.langText, language === 'en' && styles.langTextActive]}>EN</Text>
              </Pressable>
              <Pressable
                style={[styles.langPill, language === 'fil' && styles.langPillActive]}
                onPress={() => setLanguage('fil')}
              >
                <Text style={[styles.langText, language === 'fil' && styles.langTextActive]}>FIL</Text>
              </Pressable>
            </View>
            <Pressable style={styles.closeBtn} onPress={() => setOpen(false)}>
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>
        </View>

        <ScrollView ref={scrollRef} style={styles.messages} contentContainerStyle={{ padding: 16, gap: 10 }}>
          {messages.map((m) => (
            <View key={m.id} style={[styles.bubbleRow, m.from === 'user' && styles.bubbleRowUser]}>
              <View style={[styles.msgBubble, m.from === 'user' ? styles.msgUser : styles.msgBot]}>
                <Text style={m.from === 'user' ? styles.msgTextUser : styles.msgTextBot}>{m.text}</Text>
              </View>
            </View>
          ))}
          {thinking && (
            <View style={styles.bubbleRow}>
              <View style={[styles.msgBubble, styles.msgBot]}>
                <ActivityIndicator size="small" color={colors.chocolate} />
              </View>
            </View>
          )}
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickRow} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
          {quickQuestions.map((q) => (
            <Pressable key={q} style={styles.quickChip} onPress={() => respond(q)}>
              <Text style={styles.quickChipText}>{q}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder={t('chatbot_placeholder')}
            placeholderTextColor={colors.toffee}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={handleSend}
          />
          <Pressable style={styles.sendBtn} onPress={handleSend}>
            <Text style={styles.sendText}>➤</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function makeStyles(colors) {
  return StyleSheet.create({
    overlayRoot: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'flex-end', zIndex: 100 },
    backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.35)' },
    sheet: { height: '70%', maxHeight: 620, minHeight: 420, backgroundColor: colors.cream, borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden' },    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18, paddingTop: 18, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: colors.toffee },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.chocolate, alignItems: 'center', justifyContent: 'center' },
    face: { flexDirection: 'row', gap: 5, marginBottom: 2 },
    eye: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.cream },
    smile: { width: 10, height: 5, borderBottomLeftRadius: 8, borderBottomRightRadius: 8, borderWidth: 1, borderTopWidth: 0, borderColor: colors.cream },
    title: { fontSize: 14, fontWeight: '700', color: colors.espresso },
    subtitle: { fontSize: 11, color: colors.toffee },
    langSwitch: { flexDirection: 'row', backgroundColor: colors.creamAlt, borderRadius: 100, padding: 2 },
    langPill: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 100 },
    langPillActive: { backgroundColor: colors.chocolate },
    langText: { fontSize: 10, fontWeight: '700', color: colors.espresso },
    langTextActive: { color: colors.cream },
    closeBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.creamAlt, alignItems: 'center', justifyContent: 'center' },
    closeText: { color: colors.espresso, fontSize: 13 },
    messages: { flex: 1 },
    bubbleRow: { flexDirection: 'row' },
    bubbleRowUser: { justifyContent: 'flex-end' },
    msgBubble: { maxWidth: '82%', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
    msgBot: { backgroundColor: colors.creamAlt, borderBottomLeftRadius: 4 },
    msgUser: { backgroundColor: colors.chocolate, borderBottomRightRadius: 4 },
    msgTextBot: { color: colors.espresso, fontSize: 13, lineHeight: 19 },
    msgTextUser: { color: colors.cream, fontSize: 13, lineHeight: 19 },
    quickRow: { maxHeight: 44, marginBottom: 10 },
    quickChip: { backgroundColor: colors.creamAlt, borderWidth: 1, borderColor: colors.toffee, borderRadius: 100, paddingHorizontal: 14, paddingVertical: 8, justifyContent: 'center' },
    quickChipText: { fontSize: 11.5, fontWeight: '600', color: colors.espresso },
    inputRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 20, paddingTop: 6, gap: 10 },
    input: { flex: 1, backgroundColor: colors.creamAlt, borderRadius: 100, paddingHorizontal: 16, paddingVertical: 12, fontSize: 13.5, color: colors.espresso },
    sendBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.chocolate, alignItems: 'center', justifyContent: 'center' },
    sendText: { color: colors.cream, fontSize: 15 },
  });
}