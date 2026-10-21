import { findNavAnswer, matches } from './appGuide';
export const knowledge = [
  {
    id: 'onychomycosis',
    keywords: ['onychomycosis', 'fungal', 'fungus', 'thick nail', 'yellow nail'],
    answer: {
      en: 'Onychomycosis is a fungal infection of the nail. It often causes thickening, yellowing, or crumbling of the nail over time. It can spread if untreated, so a scan showing this is worth following up with a doctor or dermatologist.',
      fil: 'Ang Onychomycosis ay impeksiyong fungal ng kuko. Kadalasang nagdudulot ito ng pagkapal, pagdilaw, o pagkalagas ng kuko sa paglipas ng panahon. Maaari itong kumalat kung hindi gagamutin, kaya kung lumabas ito sa scan, kumunsulta sa doktor o dermatologist.',
    },
  },
  {
    id: 'leukonychia',
    keywords: ['leukonychia', 'white spot', 'white spots', 'white mark', 'white streak'],
    answer: {
      en: "Leukonychia refers to white spots or streaks on the nail. It's usually caused by minor trauma to the nail bed, like an accidental bump, and typically grows out on its own without treatment.",
      fil: 'Ang Leukonychia ay tumutukoy sa mga puting batik o guhit sa kuko. Karaniwang dulot ito ng maliit na trauma sa nail bed, tulad ng aksidenteng pagkabangga, at kadalasang naaalis na lang habang lumalaki ang kuko.',
    },
  },
  {
    id: 'beaus_lines',
    keywords: ["beau's lines", 'beau lines', 'ridges', 'horizontal line', 'groove'],
    answer: {
      en: "Beau's Lines are horizontal ridges or grooves across the nail. They can follow an illness, injury, or a period of poor nutrition that temporarily paused nail growth.",
      fil: "Ang Beau's Lines ay mga pahalang na guhit o guhit-guhit sa kuko. Maaari itong sumunod sa sakit, injury, o panahon ng hindi magandang nutrisyon na pansamantalang humadlang sa paglaki ng kuko.",
    },
  },
  {
    id: 'koilonychia',
    keywords: ['koilonychia', 'spoon nail', 'spoon-shaped', 'concave nail', 'curved nail'],
    answer: {
      en: 'Koilonychia is a spoon-shaped nail that curves inward instead of outward. It can sometimes be linked to low iron levels, though it also occurs without any underlying condition.',
      fil: 'Ang Koilonychia ay kuko na hugis-kutsara na kumukurba paloob sa halip na palabas. Minsan may kaugnayan ito sa mababang antas ng iron, bagama\'t nangyayari rin ito kahit walang ibang kondisyon.',
    },
  },
  {
    id: 'nail_polish_art',
    keywords: ['nail polish', 'nail art', 'gel polish', 'acrylic', 'polish bad'],
    answer: {
      en: 'Frequent nail polish or nail art — especially gel and acrylic — without breaks can trap moisture underneath, weaken the nail plate, and make it harder to spot early changes. Giving your nails polish-free breaks helps both nail health and scan accuracy.',
      fil: 'Ang madalas na paggamit ng nail polish o nail art — lalo na ang gel at acrylic — nang walang pahinga ay maaaring magpanatili ng moisture sa ilalim, magpahina sa nail plate, at nagpapahirap makita ang mga unang pagbabago. Ang pagbibigay ng pahinga sa kuko ay tumutulong sa kalusugan ng kuko at sa accuracy ng scan.',
    },
  },
  {
    id: 'healthy_signs',
    keywords: ['healthy nail', 'normal nail', 'what does healthy', 'good nail'],
    answer: {
      en: 'Healthy nails are typically smooth, uniform in color, without pitting, ridging, or discoloration, and firmly attached to the nail bed without lifting.',
      fil: 'Ang malusog na kuko ay karaniwang makinis, pantay ang kulay, walang pitting o guhit, at nakadikit nang mahigpit sa nail bed nang walang pag-angat.',
    },
  },
  {
    id: 'brittle',
    keywords: ['brittle', 'weak nail', 'breaking nail', 'splitting nail'],
    answer: {
      en: 'Brittle or splitting nails are often caused by frequent wetting and drying, harsh chemicals (like acetone), or nutritional factors. Keeping nails moisturized and giving them breaks from polish can help.',
      fil: 'Ang marupok o nahahati na kuko ay kadalasang dulot ng madalas na pagbasa at pagtuyo, malakas na kemikal (tulad ng acetone), o mga salik sa nutrisyon. Ang pagpapanatiling moisturized ng kuko at pagbibigay ng pahinga mula sa polish ay makakatulong.',
    },
  },
  {
    id: 'accuracy',
    keywords: ['accurate', 'accuracy', 'confidence score', 'how good', 'reliable'],
    answer: {
      en: 'Each scan shows a confidence score, which reflects how certain the model is about its finding — not a guarantee. Higher scores mean stronger visual matches to that condition, but this app is for early awareness, not a lab-grade diagnosis.',
      fil: 'Ang bawat scan ay nagpapakita ng confidence score, na sumasalamin sa kung gaano kasigurado ang modelo sa nakita nito — hindi ito garantiya. Ang mas mataas na score ay nangangahulugan ng mas malakas na visual match sa kondisyong iyon, pero ang app na ito ay para sa maagang kamalayan, hindi lab-grade na diagnosis.',
    },
  },
  {
    id: 'see_doctor',
    keywords: ['see a doctor', 'when should i', 'need doctor', 'dermatologist', 'worried'],
    answer: {
      en: 'See a doctor or dermatologist if you notice sudden nail changes, pain, swelling, bleeding, spreading discoloration, or if a flagged condition keeps appearing across repeated scans. This app supports early awareness — it does not replace a professional exam.',
      fil: 'Kumunsulta sa doktor o dermatologist kung mapansin mo ang biglaang pagbabago sa kuko, sakit, pamamaga, pagdurugo, kumakalat na pagbabago ng kulay, o kung paulit-ulit lumalabas ang parehong kondisyon sa mga scan. Sinusuportahan ng app na ito ang maagang kamalayan — hindi ito kapalit ng eksaminasyon ng propesyonal.',
    },
  },
  {
    id: 'how_scan_works',
    keywords: ['how does scan', 'how does the app work', 'how to scan', 'how it works'],
    answer: {
      en: "Position your nail inside the on-screen guide, keep it bare and evenly lit, then capture. The app detects each nail, analyzes it, and shows the detected condition with a confidence score, saved to your history.",
      fil: 'Ilagay ang kuko sa loob ng gabay sa screen, panatilihin itong hubad at may sapat na liwanag, pagkatapos ay kumuha ng litrato. Nakikilala ng app ang bawat kuko, sinusuri ito, at ipinapakita ang natukoy na kondisyon kasama ang confidence score, na nase-save sa iyong history.',
    },
  },
];

export function findAnswer(question, language) {
  const nav = findNavAnswer(question, language);
  if (nav) return nav;
  const hit = knowledge.find((entry) => matches(question, entry.keywords));
  return hit ? hit.answer[language] || hit.answer.en : null;
}