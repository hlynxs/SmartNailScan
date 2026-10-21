const normalize = (text) =>
  ` ${text
    .toLowerCase()
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[^a-z0-9'\u00c0-\u024f]+/g, ' ')
    .trim()} `;

// True when any keyword appears in the question as a whole word or phrase.
export function matches(question, keywords) {
  const q = normalize(question);
  return keywords.some((k) => q.includes(normalize(k)));
}

const navKnowledge = [
  {
    keywords: ['how do i scan', 'how to scan', 'how can i scan', 'how do i take a scan', 'where do i scan', 'where is the scan', 'start a scan', 'scan my nail', 'scan my nails', 'mag scan', 'paano mag scan'],
    answer: {
      en: 'To scan a nail:\n1. Tap the Scan tab in the bottom bar (or "Start a scan" on Home).\n2. Place your bare nail inside the dashed outline, in even light.\n3. Tap the round shutter button.\n4. Wait for "Analyzing…" and your result appears with a confidence score.\nTap "Save to history" to keep it.',
      fil: 'Para mag-scan ng kuko:\n1. I-tap ang I-scan sa ibabang bar (o ang "Start a scan" sa Home).\n2. Ilagay ang hubad na kuko sa loob ng may tuldok na outline, may sapat na liwanag.\n3. I-tap ang bilog na shutter button.\n4. Hintayin ang "Sinusuri…" at lalabas ang resulta kasama ang confidence score.\nI-tap ang "I-save sa kasaysayan" para itabi ito.',
    },
  },
  {
    keywords: ['scan history', 'nail history', 'past scans', 'previous scans', 'my results', 'my scans', 'history', 'kasaysayan'],
    answer: {
      en: 'Your scan history is on the Profile tab. Tap Profile in the bottom bar, then scroll down to see your condition breakdown and nail history.',
      fil: 'Nasa Profile tab ang kasaysayan ng iyong mga scan. I-tap ang Profile sa ibabang bar, tapos mag-scroll pababa para makita ang condition breakdown at kasaysayan ng kuko.',
    },
  },
  {
    keywords: ['change my photo', 'change my picture', 'change my name', 'change my phone', 'profile photo', 'profile picture', 'edit my profile', 'edit profile', 'personal information', 'litrato', 'pangalan', 'personal na impormasyon'],
    answer: {
      en: 'To change your photo, name, or phone number:\n1. Tap the Profile tab.\n2. Tap the gear icon at the top right.\n3. Choose Personal information.\n4. Tap "Change photo" or edit your details, then tap "Save changes".\nYour email can\'t be changed.',
      fil: 'Para palitan ang litrato, pangalan, o numero ng telepono:\n1. I-tap ang Profile tab.\n2. I-tap ang gear icon sa kanang itaas.\n3. Piliin ang Personal na impormasyon.\n4. I-tap ang "Change photo" o baguhin ang detalye, tapos i-tap ang "I-save ang pagbabago".\nHindi mapapalitan ang iyong email.',
    },
  },
  {
    keywords: ['language', 'dark mode', 'light mode', 'theme', 'preferences', 'wika', 'tema', 'kagustuhan', 'madilim'],
    answer: {
      en: 'To switch language or dark mode:\n1. Tap the Profile tab, then the gear icon at the top right.\n2. Choose Preferences.\n3. Use the Dark mode switch, or pick English or Filipino under Language.\nYou can also switch EN/FIL with the buttons at the top of this chat.',
      fil: 'Para palitan ang wika o dark mode:\n1. I-tap ang Profile tab, tapos ang gear icon sa kanang itaas.\n2. Piliin ang Mga Kagustuhan.\n3. Gamitin ang switch ng Madilim na mode, o piliin ang Ingles o Filipino sa Wika.\nMaaari mo ring palitan ang EN/FIL gamit ang mga button sa itaas ng chat na ito.',
    },
  },
  {
    keywords: ['notification', 'notifications', 'bell', 'reminder', 'reminders', 'abiso', 'paalala'],
    answer: {
      en: 'Tap the bell icon at the top right of Home to see your notifications ("Mark all as read" clears them). To choose which ones you get, go to Profile, tap the gear icon, then Notifications.',
      fil: 'I-tap ang bell icon sa kanang itaas ng Home para makita ang iyong mga notification ("Markahan lahat bilang nabasa na" para i-clear ang mga ito). Para piliin kung alin ang matatanggap, pumunta sa Profile, i-tap ang gear icon, tapos Mga Notification.',
    },
  },
  {
    keywords: ['settings', 'setting', 'gear icon'],
    answer: {
      en: 'Tap the Profile tab, then the gear icon at the top right. The menu has Personal information, Security & privacy, Notifications, and Preferences.',
      fil: 'I-tap ang Profile tab, tapos ang gear icon sa kanang itaas. Nasa menu ang Personal na impormasyon, Seguridad at privacy, Mga Notification, at Mga Kagustuhan.',
    },
  },
  {
    keywords: ['log out', 'logout', 'sign out', 'mag log out', 'mag logout'],
    answer: {
      en: 'Tap the Profile tab, scroll to the bottom, and tap Log out.',
      fil: 'I-tap ang Profile tab, mag-scroll sa ibaba, at i-tap ang Mag-log out.',
    },
  },
  {
    keywords: ['register', 'sign up', 'signup', 'create an account', 'create account', 'how do i log in', 'log in', 'login', 'sign in', 'mag register', 'mag sign up', 'mag log in', 'gumawa ng account'],
    answer: {
      en: 'On the welcome screen, tap Get started to create an account (name, email, password), or Log in if you already have one. You can also tap Continue with Google on the login screen.',
      fil: 'Sa welcome screen, i-tap ang Magsimula para gumawa ng account (pangalan, email, password), o Mag-log in kung mayroon ka na. Maaari mo ring i-tap ang Continue with Google sa login screen.',
    },
  },
    {
      keywords: ['change password', 'change my password', 'reset password', 'two factor', 'two-factor', '2fa', 'authenticator', 'security', 'privacy', 'palitan ang password', 'seguridad'],
      answer: {
        en: 'To change your password or turn on two-factor authentication:\n1. Tap the Profile tab, then the gear icon at the top right.\n2. Choose Security & privacy.\n3. Enter your current and new password and tap "Update password", or use the switch to set up two-factor authentication with an authenticator app.',
        fil: 'Para palitan ang password o i-on ang two-factor authentication:\n1. I-tap ang Profile tab, tapos ang gear icon sa kanang itaas.\n2. Piliin ang Seguridad at privacy.\n3. Ilagay ang kasalukuyan at bagong password at i-tap ang "I-update ang password", o gamitin ang switch para i-set up ang two-factor authentication gamit ang authenticator app.',
      },
    },
  {
    keywords: ['dashboard', 'home tab', 'home screen', 'go home', 'health tips', 'nail tips'],
    answer: {
      en: 'Tap Home in the bottom bar. It has your Start a scan card and nail health tips. Pull down to refresh the tips.',
      fil: 'I-tap ang Home sa ibabang bar. Nandoon ang Start a scan card at mga tip sa kalusugan ng kuko. Hilahin pababa para i-refresh ang mga tip.',
    },
  },
];

export function findNavAnswer(question, language) {
  const hit = navKnowledge.find((entry) => matches(question, entry.keywords));
  return hit ? hit.answer[language] || hit.answer.en : null;
}