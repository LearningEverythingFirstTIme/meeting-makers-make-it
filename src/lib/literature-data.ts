export interface LiteratureItem {
  id: string;
  title: string;
  category: "foundational" | "steps" | "prayers" | "promises" | "service";
  content: string[];
  source?: string;
}

export const literatureData: LiteratureItem[] = [
  // FOUNDATIONAL
  {
    id: "preamble",
    title: "AA Preamble",
    category: "foundational",
    source: "Alcoholics Anonymous",
    content: [
      "Alcoholics Anonymous is a fellowship of people who share their experience, strength and hope with each other that they may solve their common problem and help others to recover from alcoholism. The only requirement for membership is a desire to stop drinking. There are no dues or fees for AA membership; we are self-supporting through our own contributions. AA is not allied with any sect, denomination, politics, organization or institution; does not wish to engage in any controversy; neither endorses nor opposes any causes. Our primary purpose is to stay sober and help other alcoholics to achieve sobriety."
    ]
  },
  {
    id: "responsibility-statement",
    title: "Responsibility Statement",
    category: "foundational",
    source: "AA Conference 1965",
    content: [
      "I am responsible. When anyone, anywhere, reaches out for help, I want the hand of AA always to be there. And for that: I am responsible."
    ]
  },
  {
    id: "how-it-works",
    title: "How It Works",
    category: "foundational",
    source: "Alcoholics Anonymous, Page 58-60",
    content: [
      "Rarely have we seen a person fail who has thoroughly followed our path. Those who do not recover are people who cannot or will not completely give themselves to this simple program, usually men and women who are constitutionally incapable of being honest with themselves. There are such unfortunates. They are not at fault; they seem to have been born that way. They are naturally incapable of grasping and developing a manner of living which demands rigorous honesty. Their chances are less than average. There are those, too, who suffer from grave emotional and mental disorders, but many of them do recover if they have the capacity to be honest.",
      "Our stories disclose in a general way what we used to be like, what happened, and what we are like now. If you have decided you want what we have and are willing to go to any length to get it—then you are ready to take certain steps.",
      "At some of these we balked. We thought we could find an easier, softer way. But we could not. With all the earnestness at our command, we beg of you to be fearless and thorough from the very start. Some of us have tried to hold on to our old ideas and the result was nil until we let go absolutely.",
      "Remember that we deal with alcohol—cunning, baffling, powerful! Without help it is too much for us. But there is One who has all power—that One is God. May you find Him now!",
      "Half measures availed us nothing. We stood at the turning point. We asked His protection and care with complete abandon.",
      "Here are the steps we took, which are suggested as a program of recovery:"
    ]
  },
  // THE 12 STEPS
  {
    id: "twelve-steps",
    title: "The Twelve Steps",
    category: "steps",
    source: "Alcoholics Anonymous",
    content: [
      "1. We admitted we were powerless over alcohol—that our lives had become unmanageable.",
      "2. Came to believe that a Power greater than ourselves could restore us to sanity.",
      "3. Made a decision to turn our will and our lives over to the care of God as we understood Him.",
      "4. Made a searching and fearless moral inventory of ourselves.",
      "5. Admitted to God, to ourselves, and to another human being the exact nature of our wrongs.",
      "6. Were entirely ready to have God remove all these defects of character.",
      "7. Humbly asked Him to remove our shortcomings.",
      "8. Made a list of all persons we had harmed, and became willing to make amends to them all.",
      "9. Made direct amends to such people wherever possible, except when to do so would injure them or others.",
      "10. Continued to take personal inventory and when we were wrong promptly admitted it.",
      "11. Sought through prayer and meditation to improve our conscious contact with God as we understood Him, praying only for knowledge of His will for us and the power to carry that out.",
      "12. Having had a spiritual awakening as the result of these steps, we tried to carry this message to alcoholics, and to practice these principles in all our affairs."
    ]
  },
  // THE 12 TRADITIONS
  {
    id: "twelve-traditions",
    title: "The Twelve Traditions",
    category: "steps",
    source: "Alcoholics Anonymous",
    content: [
      "1. Our common welfare should come first; personal recovery depends upon AA unity.",
      "2. For our group purpose there is but one ultimate authority—a loving God as He may express Himself in our group conscience. Our leaders are but trusted servants; they do not govern.",
      "3. The only requirement for AA membership is a desire to stop drinking.",
      "4. Each group should be autonomous except in matters affecting other groups or AA as a whole.",
      "5. Each group has but one primary purpose—to carry its message to the alcoholic who still suffers.",
      "6. An AA group ought never endorse, finance, or lend the AA name to any related facility or outside enterprise, lest problems of money, property, and prestige divert us from our primary purpose.",
      "7. Every AA group ought to be fully self-supporting, declining outside contributions.",
      "8. Alcoholics Anonymous should remain forever nonprofessional, but our service centers may employ special workers.",
      "9. AA, as such, ought never be organized; but we may create service boards or committees directly responsible to those they serve.",
      "10. Alcoholics Anonymous has no opinion on outside issues; hence the AA name ought never be drawn into public controversy.",
      "11. Our public relations policy is based on attraction rather than promotion; we need always maintain personal anonymity at the level of press, radio, and films.",
      "12. Anonymity is the spiritual foundation of all our Traditions, ever reminding us to place principles before personalities."
    ]
  },
  // THE 12 CONCEPTS
  {
    id: "twelve-concepts",
    title: "The Twelve Concepts",
    category: "service",
    source: "AA World Service",
    content: [
      "1. Final responsibility and ultimate authority for AA world services should always reside in the collective conscience of our whole Fellowship.",
      "2. The AA groups delegate to the General Service Conference the authority necessary for them to provide for and conduct AA world services.",
      "3. As a traditional means of creating and maintaining a clearly defined working relation between the groups and the Conference, the Charter is subscribed to by all of them and by all members of the Conference.",
      "4. Throughout the Conference structure, the traditional \"right of decision\" in all matters affecting the Conference, its services, and the Fellowship of AA, should be assured to the Conference itself.",
      "5. Throughout the Conference structure, the traditional \"right of participation\" in all matters affecting the Conference, its services, and the Fellowship of AA, should be assured to all members of the Conference.",
      "6. The Conference recognizes that the Charter and the spirit of the 12 Traditions should be the sole basis of Conference policy and action in all matters affecting the Conference, its services, and the Fellowship of AA.",
      "7. The Charter of the Conference is to be regarded as the working document of reference and final authority in all matters affecting the Conference, its services, and the Fellowship of AA.",
      "8. The Trustees of the General Service Board act in two primary capacities: (a) With respect to the larger matters of overall policy and finance, they are the principal planners and administrators. They and their primary committees directly manage these affairs. (b) With respect to our separately incorporated and constantly active services, the relation of the Trustees is that of custodial oversight which they exercise through their ability to elect all directors of these entities.",
      "9. Good service leadership at all levels is indispensable for our future functioning and safety. Primary world service leadership, once exercised by the founders, must necessarily be assumed by the trustees.",
      "10. Every service responsibility shall be matched by an equal service authority—the scope of such authority to be always well defined whether by tradition, by resolution, by specific job description or by appropriate charters and by-laws.",
      "11. While the trustees hold final responsibility for AA world service administration, they should always have the assistance of the best possible standing committees, executives, staffs and consultants.",
      "12. The trustees should always have the best possible standing committees, executives, staffs and consultants to assist them in their work."
    ]
  },
  // PRAYERS - STEP PRAYERS
  {
    id: "step-prayers",
    title: "Step Prayers",
    category: "prayers",
    source: "Various",
    content: [
      "STEP 1 PRAYER:",
      "I admit that I am powerless over my addiction. I admit that my life is unmanageable when I try to control it. Help me this day to understand the true meaning of powerlessness. Remove from me all denial of my addiction.",
      "",
      "STEP 2 PRAYER:",
      "I pray for an open mind and a new way of life that can restore me to sanity. Grant me the gift of faith so that I may believe in things I cannot see.",
      "",
      "STEP 3 PRAYER (Traditional):",
      "God, I offer myself to Thee—to build with me and to do with me as Thou wilt. Relieve me of the bondage of self, that I may better do Thy will. Take away my difficulties, that victory over them may bear witness to those I would help of Thy Power, Thy Love, and Thy Way of life. May I do Thy will always!",
      "",
      "STEP 4 PRAYER:",
      "God, please help me to honestly examine my strengths and weaknesses, my assets and my defects. Guide me as I search my heart and mind for a true and accurate picture of my life.",
      "",
      "STEP 5 PRAYER:",
      "God, give me the courage to share my inventory with another human being. Help me to be honest and thorough, hiding nothing. Remove my fear of judgment.",
      "",
      "STEP 6 PRAYER:",
      "I am ready to have God remove all these defects of character. I ask for the willingness to let go of my old ways and accept the changes that recovery brings.",
      "",
      "STEP 7 PRAYER (Traditional):",
      "My Creator, I am now willing that you should have all of me, good and bad. I pray that you now remove from me every single defect of character which stands in the way of my usefulness to you and my fellows. Grant me strength, as I go out from here, to do your bidding. Amen.",
      "",
      "STEP 8 PRAYER:",
      "God, help me to make a list of all those I have harmed. Give me the willingness to make amends to them all, and the wisdom to know when and how to do so.",
      "",
      "STEP 9 PRAYER:",
      "God, grant me the courage to make direct amends wherever possible. Give me the wisdom to know when making amends would cause more harm than good. Help me to restore justice where I can.",
      "",
      "STEP 10 PRAYER:",
      "God, help me to continue to take personal inventory. When I am wrong, prompt me to promptly admit it. Keep me mindful of my thoughts, words, and actions throughout the day.",
      "",
      "STEP 11 PRAYER (Morning):",
      "God, direct my thinking today so that it be divorced of self-pity, dishonesty, self-will, self-seeking and fear. Guide me in my meditation and help me to improve my conscious contact with You. Grant me the knowledge of Your will for me and the power to carry that out.",
      "",
      "STEP 11 PRAYER (Evening):",
      "God, as I review my day, show me where I have fallen short. Help me to make amends where needed and to learn from my mistakes. Thank You for the blessings of this day.",
      "",
      "STEP 12 PRAYER:",
      "Having had a spiritual awakening, I pray for the opportunity to carry this message to others. Help me to practice these principles in all my affairs. Use me as an instrument of Your peace."
    ]
  },
  // BIG BOOK PRAYERS
  {
    id: "serenity-prayer",
    title: "The Serenity Prayer",
    category: "prayers",
    source: "Reinhold Niebuhr",
    content: [
      "God, grant me the serenity",
      "To accept the things I cannot change,",
      "The courage to change the things I can,",
      "And the wisdom to know the difference.",
      "",
      "Living one day at a time,",
      "Enjoying one moment at a time,",
      "Accepting hardship as the pathway to peace.",
      "Taking, as He did, this sinful world as it is,",
      "Not as I would have it.",
      "Trusting that He will make all things right",
      "If I surrender to His will.",
      "That I may be reasonably happy in this life,",
      "And supremely happy with Him forever in the next.",
      "Amen."
    ]
  },
  {
    id: "third-step-prayer",
    title: "Third Step Prayer",
    category: "prayers",
    source: "Alcoholics Anonymous, Page 63",
    content: [
      "God, I offer myself to Thee—",
      "To build with me and to do with me as Thou wilt.",
      "Relieve me of the bondage of self,",
      "That I may better do Thy will.",
      "Take away my difficulties,",
      "That victory over them may bear witness",
      "To those I would help of Thy Power,",
      "Thy Love, and Thy Way of life.",
      "May I do Thy will always!"
    ]
  },
  {
    id: "seventh-step-prayer",
    title: "Seventh Step Prayer",
    category: "prayers",
    source: "Alcoholics Anonymous, Page 76",
    content: [
      "My Creator,",
      "I am now willing that you should have all of me,",
      "Good and bad.",
      "I pray that you now remove from me",
      "Every single defect of character",
      "Which stands in the way of my usefulness to you and my fellows.",
      "Grant me strength, as I go out from here,",
      "To do your bidding.",
      "Amen."
    ]
  },
  {
    id: "st-francis-prayer",
    title: "St. Francis Prayer",
    category: "prayers",
    source: "Attributed to St. Francis of Assisi",
    content: [
      "Lord, make me a channel of thy peace—",
      "That where there is hatred, I may bring love;",
      "That where there is wrong, I may bring the spirit of forgiveness;",
      "That where there is discord, I may bring harmony;",
      "That where there is error, I may bring truth;",
      "That where there is doubt, I may bring faith;",
      "That where there is despair, I may bring hope;",
      "That where there are shadows, I may bring light;",
      "That where there is sadness, I may bring joy.",
      "",
      "Lord, grant that I may seek rather to",
      "Comfort than to be comforted;",
      "To understand, than to be understood;",
      "To love, than to be loved.",
      "For it is by self-forgetting that one finds.",
      "It is by forgiving that one is forgiven.",
      "It is by dying that one awakens to Eternal Life."
    ]
  },
  {
    id: "set-aside-prayer",
    title: "Set Aside Prayer",
    category: "prayers",
    source: "AA",
    content: [
      "God,",
      "Please help me set aside",
      "Everything I think I know",
      "About You,",
      "About me,",
      "And about this program",
      "For an open mind",
      "And a new experience",
      "With You,",
      "With me,",
      "And with this program.",
      "Amen."
    ]
  },
  {
    id: "lunch-prayer",
    title: "Lunch Prayer",
    category: "prayers",
    source: "AA",
    content: [
      "God,",
      "We ask You to bless this food",
      "We are about to receive",
      "To nourish and strengthen our bodies.",
      "May we remember those",
      "Who are not as fortunate as we are.",
      "We ask that You continue to guide us",
      "In our recovery.",
      "Amen."
    ]
  },
  {
    id: "prayer-of-surrender",
    title: "Prayer of Surrender",
    category: "prayers",
    source: "AA",
    content: [
      "I can do something you cannot do—",
      "Surrender completely.",
      "",
      "You can do something I cannot do—",
      "Change me.",
      "",
      "So I surrender to You,",
      "And You change me."
    ]
  },
  {
    id: "quiet-prayer",
    title: "Quiet Prayer",
    category: "prayers",
    source: "AA",
    content: [
      "God,",
      "Help me to sit quietly",
      "And know that You are God.",
      "Let me be still",
      "And listen for Your voice.",
      "Calm my restless mind",
      "And anxious heart.",
      "Fill me with Your peace.",
      "Amen."
    ]
  },
  // PROMISES
  {
    id: "ninth-step-promises",
    title: "The Ninth Step Promises",
    category: "promises",
    source: "Alcoholics Anonymous, Page 83-84",
    content: [
      "If we are painstaking about this phase of our development, we will be amazed before we are half way through.",
      "",
      "We are going to know a new freedom and a new happiness.",
      "We will not regret the past nor wish to shut the door on it.",
      "We will comprehend the word serenity and we will know peace.",
      "No matter how far down the scale we have gone, we will see how our experience can benefit others.",
      "That feeling of uselessness and self-pity will disappear.",
      "We will lose interest in selfish things and gain interest in our fellows.",
      "Self-seeking will slip away.",
      "Our whole attitude and outlook upon life will change.",
      "Fear of people and of economic insecurity will leave us.",
      "We will intuitively know how to handle situations which used to baffle us.",
      "We will suddenly realize that God is doing for us what we could not do for ourselves.",
      "",
      "Are these extravagant promises? We think not. They are being fulfilled among us—sometimes quickly, sometimes slowly. They will always materialize if we work for them."
    ]
  },
  {
    id: "big-book-promises",
    title: "Promises from the Big Book",
    category: "promises",
    source: "Various pages from Alcoholics Anonymous",
    content: [
      "FROM PAGE 25:",
      "There is a solution. Almost none of us liked the self-searching, the leveling of our pride, the confession of shortcomings which the process requires for its successful consummation. But we saw that it really worked in others, and we had come to believe in the hopelessness and futility of life as we had been living it. When, therefore, we were approached by those in whom the problem had been solved, there was nothing left for us but to pick up the simple kit of spiritual tools laid at our feet. We have found much of heaven and we have been rocketed into a fourth dimension of existence of which we had not even dreamed.",
      "",
      "FROM PAGE 83:",
      "The spiritual life is not a theory. We have to live it.",
      "",
      "FROM PAGE 89:",
      "Life will take on new meaning. To watch people recover, to see them help others, to watch loneliness vanish, to see a fellowship grow up about you, to have a host of friends—this is an experience you must not miss. We know you will not want to miss it. Frequent contact with newcomers and with each other is the bright spot of our lives.",
      "",
      "FROM PAGE 124:",
      "We have not even sworn off. Instead, the problem has been removed. It does not exist for us. We are neither cocky nor are we afraid. That is our experience. That is how we react so long as we keep in fit spiritual condition.",
      "",
      "FROM PAGE 152:",
      "The tremendous fact for every one of us is that we have discovered a common solution. We have a way out on which we can absolutely agree, and upon which we can join in brotherly and harmonious action."
    ]
  }
];

export const categories = [
  { id: "foundational", label: "Foundational", color: "var(--butter)" },
  { id: "steps", label: "Steps & Traditions", color: "var(--mint)" },
  { id: "prayers", label: "Prayers", color: "var(--periwinkle)" },
  { id: "promises", label: "Promises", color: "var(--coral)" },
  { id: "service", label: "Service", color: "var(--cream)" }
] as const;
