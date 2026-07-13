/**
 * Verified Kabyle pronunciation rules (from Boulifa's "Première année", pp.12-15,
 * + standard Kabyle phonology). Injected into the tutor so Idir never invents
 * phonetics · the #1 thing LLMs get wrong in Kabyle.
 */
export const PRONUNCIATION_REF = `RÈGLES DE PRONONCIATION DU KABYLE (orthographe latine standard) · utilise-les TELLES QUELLES, n'invente jamais une autre prononciation :

Voyelles · il n'y en a que 3 vraies :
- a = "a" de « patte »
- i = "i" de « midi »
- u = "ou" de « loup »
- e (ⴻ) n'est PAS une vraie voyelle : c'est un "e" très bref / muet (schwa) qui sert juste à faire sonner les consonnes ; il ne se compte presque pas.

Consonnes particulières (les pièges) · formulations de la page prononciation de l'Assimil « Le Kabyle de poche » :
- ɣ = le « r » NON roulé qui vient du fond de la gorge, le « r » parisien de « rire » · surtout PAS un « g ».
- ɛ = un raclement du fond de la gorge (le « ع » arabe) · surtout PAS une voyelle.
- ḥ = le son émis quand tu avales une bouchée d'un plat très épicé : une forte expiration d'air SANS faire résonner les cordes vocales (≠ h normal).
- x = « kh », comme le « j » espagnol de Juan (ou le « ch » dur allemand).
- q = une sorte de « k » prononcé au fond de la gorge avec fermeture brutale de la glotte (fais le « r » non roulé puis appuie sur la glotte).
- ṣ ṭ ḍ ẓ ṛ = consonnes EMPHATIQUES : mêmes sons que s t d z r mais « lourds/sombres », bouche plus ouverte, langue reculée ; elles changent le sens.
- č = "tch" · ǧ = "dj" · j = "j" français · c = "ch" français.
- d et t simples sont souvent SPIRANTS : d ≈ le « th » anglais de « this », t ≈ le « th » de « thing » (sauf après n/l, ou s'ils sont géminés/emphatiques → nets).
- s et z toujours durs, même entre deux voyelles.

Gémination (consonne doublée : tt, mm, ss, …) : se prononce LONGUE et appuyée, et ça change le sens · ne jamais l'ignorer.

Accent : syllabes assez égales, pas d'accent tonique fort à l'anglaise.

RÈGLE D'OR : la seule vraie façon d'apprendre un son kabyle, c'est d'ÉCOUTER une voix native. Pour toute question de prononciation : donne la règle exacte ci-dessus, découpe le mot en syllabes simplement, PUIS invite l'élève à écouter l'audio natif du mot dans l'app. N'invente JAMAIS une transcription du type « ça se dit X de Y ».`;

export const PRON_TRIGGER = /pronon|prononc|se dit|comment dire|à voix|accent|\blire\b|\bson\b|syllab/i;
