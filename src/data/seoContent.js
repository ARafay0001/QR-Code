export const AllcalculatorsArticle = {
  id: "online-calculators-guide",
  title: "Find a Calculator for Everyday, Math, Finance, and Health Tasks",
  intro:
    "Toolited's calculator directory groups useful calculators in one searchable workspace. Browse categories or search for a calculation, then open the calculator that matches your task.",
  sections: [
    {
      heading: "Browse calculators by category",
      paragraphs: [
        "Explore math, financial, health and fitness, and everyday calculators. Search and category filters help narrow the directory when you already know the kind of result you need.",
        "Each calculator uses its own inputs and assumptions. Read the labels and instructions for the selected calculator, enter values with the displayed units, and check the result before relying on it.",
      ],
    },
    {
      heading: "Use estimates with the right context",
      paragraphs: [
        "Calculator results depend on the information you enter and the formulas used. Financial and health calculations can simplify real-world situations and should not replace professional advice or a detailed assessment.",
        "For important decisions, verify assumptions with an appropriate professional or authoritative source. Treat health-related results as informational estimates, not medical advice.",
      ],
    },
  ],
  relatedTools: [
    { label: "Scientific calculator", href: "/scientific-calculator" },
    { label: "Unit converter", href: "/unit-converter" },
    { label: "Currency converter", href: "/currency-converter" },
  ],
};

export const AllcalculatorsFAQ = [
  {
    question: "What kinds of calculators are included?",
    answer:
      "The directory includes math, finance, health and fitness, and other everyday calculators. Use the search and category filters to find one.",
  },
  {
    question: "Are calculator results professional advice?",
    answer:
      "No. Results are based on the inputs and assumptions of each calculator. Health results are informational estimates, not medical advice; seek qualified guidance for important decisions.",
  },
  {
    question: "How do I find a specific calculator?",
    answer:
      "Search by the calculation you want or select a category. Open a result to enter values in that calculator's workspace.",
  },
  {
    question: "Why might my result differ from another calculator?",
    answer:
      "Calculators can use different assumptions, formulas, rounding, or input units. Check the method and units before comparing results.",
  },
];

export const BackgroundRemoverArticle = {
  title: "How to Remove the Background from an Image Online",

  intro:
    "Removing the background from a photo lets you isolate a person, product, or object and place it on any new background. Toolited's background remover runs an AI model directly in your browser, so you can create a transparent PNG without installing software or creating an account.",

  sections: [
    {
      heading: "What can you do with a transparent background?",
      paragraphs: [
        "A transparent PNG keeps only your subject, which makes it easy to reuse in other designs. Many people remove backgrounds to prepare images for stores, profiles, presentations, and social posts.",
      ],
      bullets: [
        "Create clean product photos for online shops and marketplaces.",
        "Cut out a person for a profile picture, ID-style photo, or video thumbnail.",
        "Place a subject on a solid color, gradient, or new scene.",
        "Prepare logos, stickers, and graphics for posters or presentations.",
      ],
    },
    {
      heading: "How to remove a background in a few steps",
      paragraphs: [
        "Upload a PNG, JPG, or WEBP image by dragging it onto the tool, browsing for it, or pasting it from your clipboard with Ctrl+V. Then select Remove Background and wait for the AI to separate the subject from the background.",
        "Use the preview to compare the result with your original, then download the finished image as a transparent PNG.",
      ],
    },
    {
      heading: "Tips for cleaner cutouts",
      paragraphs: [
        "Results depend on the photo. Clear contrast between the subject and the background usually gives the sharpest edges, while fine details such as hair, fur, or thin objects are harder to separate.",
        "If the edges are not accurate on your device, use the Improve quality option when it appears. It runs a more detailed model, which can take longer on slower devices.",
      ],
      bullets: [
        "Use a well-lit photo with the subject in focus.",
        "Choose a background that differs in color from the subject when you can.",
        "Start with the highest-resolution image available.",
        "Check edges against both light and dark backgrounds before using the file.",
      ],
    },
    {
      heading: "Is it safe to remove backgrounds online?",
      paragraphs: [
        "File privacy depends on how a tool processes images. This tool runs its AI model inside your browser, so your photo stays on your device while the background is removed. If you use any online tool with sensitive images, check how it handles files before uploading.",
      ],
    },
  ],

  relatedTools: [
    { label: "Image Compressor", href: "/image-compressor" },
    { label: "Image to PDF", href: "/pdf-tools/image-to-pdf" },
    { label: "Compress PDF", href: "/pdf-tools/compress" },
  ],
};

export const BackgroundRemoverFAQ = [
  {
    question: "Is this background remover really free?",
    answer:
      "Yes. You can remove backgrounds without paying, creating an account, or getting a watermark on your image.",
  },
  {
    question: "Are my images uploaded to a server?",
    answer:
      "No. The AI model runs in your browser, so your photos stay on your device while the background is removed.",
  },
  {
    question: "Which image formats can I use?",
    answer:
      "You can upload PNG, JPG, JPEG, and WEBP images up to 20 MB. The result downloads as a PNG with a transparent background.",
  },
  {
    question: "Why is the result different on some devices?",
    answer:
      "Devices with GPU acceleration use a more detailed model. Other devices use a lighter model and a smaller working size to stay responsive, and an Improve quality option may be offered to refine the result.",
  },
  {
    question: "What does the Improve quality button do?",
    answer:
      "It processes your image again with a more detailed model for better edges. This can take longer on slower devices, and your first result stays available if you cancel.",
  },
  {
    question: "Can I paste an image instead of uploading it?",
    answer:
      "Yes. Copy an image and press Ctrl+V (or Cmd+V on Mac) while the page is open to load it straight into the tool.",
  },
  {
    question: "Can I use the background remover on my phone?",
    answer:
      "Yes. The tool adapts to smaller screens, though processing may take longer on older phones.",
  },
];

export const CompressorToolsArticle = {
  id: "image-and-video-compression",
  title: "Choose the Right Image or Video Compressor",
  intro:
    "Image and video files can be large enough to slow down uploads or exceed sharing limits. Toolited brings its image and video compression tools together so you can choose the workflow that fits your media.",
  sections: [
    {
      heading: "Compress images for web and sharing",
      paragraphs: [
        "Use the image compressor for supported JPEG, PNG, and WebP files. It offers quality and size controls and can process multiple images in one session. Compare the output with the original to find a useful balance between clarity and smaller files.",
        "If you need to change formats rather than compress an image, the WebP converter can create JPG or PNG files. The background remover and vector converter provide separate image workflows.",
      ],
    },
    {
      heading: "Compress videos for easier delivery",
      paragraphs: [
        "Use the video compressor to choose a target file-size preset and output resolution for supported videos. Its browser-based encoding can take longer for large or high-resolution videos, so allow the tab to remain open while processing.",
        "Always review the exported file before deleting the original. Compression is lossy in many workflows, and reducing resolution or target size can affect visible detail.",
      ],
    },
  ],
  relatedTools: [
    { label: "Image compressor", href: "/image-compressor" },
    { label: "Video compressor", href: "/video-compressor" },
    { label: "WebP converter", href: "/webp-to-image" },
  ],
};

export const CompressorToolsFAQ = [
  {
    question: "Which compressor should I use?",
    answer:
      "Choose the image compressor for JPEG, PNG, or WebP images, and the video compressor for supported video files. Use the WebP converter when your main goal is changing an image format.",
  },
  {
    question: "Will compression keep the original quality?",
    answer:
      "Compression settings can reduce image or video detail. Compare the downloaded result with your original and keep the original until you are satisfied.",
  },
  {
    question: "Can I compress files on a phone?",
    answer:
      "The tools run in a modern browser, but processing large images or videos depends on your device's memory and performance. Smaller files are generally more practical on phones.",
  },
  {
    question: "Where do I find the individual tools?",
    answer:
      "Open the image compressor or video compressor from this page to access its separate controls and supported formats.",
  },
];

export const CurrencyConverterArticle = {
  title: "How to Convert Currency Online and Understand Exchange Rates",
 
  intro:
    "Whether you are shopping from an overseas store, planning a trip, sending money to family, or pricing work for an international client, you need to know what an amount is worth in another currency. Toolited's currency converter turns any amount into more than 160 world currencies using up-to-date exchange rates, so you can get a clear estimate in a few seconds.",
 
  sections: [
    {
      heading: "What is a currency converter?",
      paragraphs: [
        "A currency converter calculates how much a sum of money in one currency is worth in another. It multiplies your amount by the exchange rate between the two currencies. For example, if 1 US dollar equals a certain number of Pakistani rupees, then 100 dollars is worth 100 times that rate.",
        "Exchange rates change as currencies are traded on global markets, which is why the same amount can be worth slightly more or less from one day to the next.",
      ],
    },
    {
      heading: "How to convert currency step by step",
      paragraphs: [
        "Converting an amount with Toolited takes only a few clicks.",
      ],
      bullets: [
        "Enter the amount you want to convert, or tap one of the quick amounts.",
        "Choose the currency you are converting from, for example USD.",
        "Choose the currency you want to convert to, for example PKR, EUR, GBP or AED.",
        "Read the converted amount and the exchange rate shown below it.",
        "Use the swap button to reverse the conversion, or select another popular currency to compare.",
      ],
    },
    {
      heading: "What affects exchange rates?",
      paragraphs: [
        "Exchange rates move for many reasons. Interest rates set by central banks, inflation, economic growth, trade balances, political events and market demand all influence how strong or weak a currency is compared with others.",
        "Because of this, a rate you checked last week may not match today's rate. Always check a recent rate before you make a payment or a financial decision.",
      ],
    },
    {
      heading: "Why the converter rate can differ from your bank's rate",
      paragraphs: [
        "The rate shown by an online converter is a reference rate. Banks, exchange offices, card providers and money-transfer services usually add a margin or a fee on top of it, so the amount you actually receive or pay is often a little different.",
        "Use the converter to estimate and compare, then confirm the final rate and any fees with your bank or provider before you send or exchange money.",
      ],
    },
    {
      heading: "Common ways to use a currency converter",
      paragraphs: [
        "A converter is useful in many everyday situations.",
      ],
      bullets: [
        "Checking the price of products from international online stores.",
        "Budgeting for travel, hotels and daily spending abroad.",
        "Estimating the value of money sent or received from overseas.",
        "Pricing freelance work and invoices for clients in other countries.",
        "Comparing salaries, tuition fees or costs between countries.",
        "Following the value of savings or investments held in foreign currency.",
      ],
    },
    {
      heading: "Tips for getting the best value when exchanging money",
      paragraphs: [
        "Compare at least two or three providers instead of accepting the first offer. Look at both the exchange rate and any fixed fees, because a low fee with a poor rate can cost more than a higher fee with a better rate.",
        "Avoid exchanging large amounts at airports where margins are often wider, and be careful with offers that advertise zero fees but hide the cost in the rate. For larger transfers, check whether you can wait for a more favourable rate, but remember that rates can move in either direction.",
      ],
    },
  ],
 
  relatedTools: [
    { label: "Unit Converter", href: "/unit-converter" },
    { label: "Scientific Calculator", href: "/scientific-calculator" },
    { label: "Text Tool", href: "/text-tool" },
    { label: "QR Code Generator", href: "/qr-generator" },
  ],
};

export const CurrencyConverterFAQ = [
  {
    question: "How does the currency converter work?",
    answer:
      "You enter an amount and choose two currencies. The tool loads current exchange rates and multiplies your amount by the rate between the two currencies. The result and the rate in both directions appear instantly.",
  },
  {
    question: "How many currencies can I convert?",
    answer:
      "You can convert between more than 160 world currencies, including USD, EUR, GBP, PKR, INR, AED, SAR, CAD, AUD, CNY, JPY and TRY. The most popular currencies are listed first to make them easy to find.",
  },
  {
    question: "How often are the exchange rates updated?",
    answer:
      "The converter uses daily reference rates. The date and time of the latest update are shown under the result, and you can use the refresh button to load the newest rates available.",
  },
  {
    question: "Is this the same rate my bank will give me?",
    answer:
      "Not exactly. The converter shows a reference rate for estimating values. Banks, exchange offices and transfer services usually add fees or a margin, so confirm the final rate with your provider before you exchange or send money.",
  },
  {
    question: "Can I convert Pakistani rupees (PKR) to US dollars and other currencies?",
    answer:
      "Yes. Choose PKR as the currency you are converting from and pick USD, EUR, GBP, AED, SAR or any other currency in the To list. You can also tap the swap button to reverse the direction instantly.",
  },
  {
    question: "Is the currency converter free to use?",
    answer:
      "Yes. The converter is free, needs no account or sign-up, and has no limit on how many conversions you can make.",
  },
  {
    question: "Does it work on a phone?",
    answer:
      "Yes. The page adapts to smaller screens, so you can check a rate on your phone while you shop, travel or send money.",
  },
  {
    question: "Should I use it for large financial decisions?",
    answer:
      "Use it as a quick guide. For large payments, investments or contracts, check the live rate and fees with your bank or a licensed provider, because rates can change quickly and the figures here are for information only.",
  },
];

export const DiceRollerArticle = {
  title: "How to Roll Dice Online: D6, D20, Custom Dice and Coin Flips",
 
  intro:
    "Whether you are playing a board game without your dice, running a tabletop role-playing session, settling a friendly argument, or teaching probability, a reliable online dice roller saves time. Toolited's dice roller throws 3D dice onto a table, shows the result on the top face, and adds up the total for you. You can also roll a D20 or a custom die, or flip coins.",
 
  sections: [
    {
      heading: "What can you roll with this dice roller?",
      paragraphs: [
        "Different games need different dice, so the roller lets you switch between several types in one click.",
      ],
      bullets: [
        "Classic d6: up to 6 six-sided dice with real pips, thrown onto the table in 3D.",
        "D20: the twenty-sided die used in many tabletop role-playing games.",
        "Custom die: choose any number of sides from 2 to 100, such as a d4, d8, d10, d12 or d100.",
        "Coin flip: toss one or more coins and see the count of heads and tails.",
      ],
    },
    {
      heading: "How to roll the dice",
      paragraphs: ["Rolling takes only a few steps."],
      bullets: [
        "Pick the dice type: classic d6, D20, coin flip or custom die.",
        "Set how many dice or coins you want to roll.",
        "Choose a dice color if you like.",
        "Press the roll button and watch the dice tumble, bounce and land.",
        "Read the value on the top face of each die and the total underneath.",
      ],
    },
    {
      heading: "How are the results decided?",
      paragraphs: [
        "Each roll picks a random result in your browser, and the animation is then played so the die lands on that result. Every face has an equal chance of coming up, so a six is exactly as likely as a one.",
        "The roller is designed for games, learning and everyday decisions. It is not meant for gambling or for security uses such as generating passwords.",
      ],
    },
    {
      heading: "Common uses for an online dice roller",
      paragraphs: ["People use a digital dice roller in many everyday situations."],
      bullets: [
        "Playing Ludo, Monopoly, Snakes and Ladders and other board games when the dice are missing.",
        "Rolling a D20 or other polyhedral dice for Dungeons & Dragons and similar tabletop games.",
        "Deciding who goes first, who pays, or who does a chore.",
        "Teaching probability, averages and chance in the classroom.",
        "Flipping a coin to make a quick yes or no choice.",
      ],
    },
    {
      heading: "Understanding dice probability",
      paragraphs: [
        "With a single six-sided die, each number from 1 to 6 has a one in six chance. When you roll two dice and add them together, the totals are no longer equally likely. A total of 7 is the most common result, because six different combinations make it, while 2 and 12 can each be made only one way.",
        "The same idea applies to larger groups of dice. The more dice you add, the more the totals cluster around the middle of the possible range.",
      ],
    },
  ],
 
  relatedTools: [
    { label: "Spin the Wheel", href: "/games/spin-wheel" },
    { label: "Scientific Calculator", href: "/scientific-calculator" },
    { label: "Typing Tutor", href: "/typing-tutor" },
    { label: "Currency Converter", href: "/currency-converter" },
  ],
};

export const DiceRollerFAQ = [
  {
    question: "Is the online dice roller really random?",
    answer:
      "Yes. Each roll chooses a random result in your browser and every side has an equal chance. It is fair for games and everyday decisions, but it should not be used for gambling or security purposes.",
  },
  {
    question: "What types of dice can I roll?",
    answer:
      "You can roll classic six-sided dice, a twenty-sided D20, a custom die with 2 to 100 sides, and coins for heads or tails.",
  },
  {
    question: "How many dice can I roll at once?",
    answer:
      "You can roll up to 6 classic dice at once, or up to 10 dice or coins in the other modes. The total is added up for you when you roll more than one die.",
  },
  {
    question: "Can I use it for Dungeons & Dragons?",
    answer:
      "Yes. Use the D20 for attack and skill checks, or the custom die to roll a d4, d6, d8, d10, d12 or d100. Roll several dice together and the tool shows each result and the total.",
  },
  {
    question: "Why does the result show on the top face of the die?",
    answer:
      "The table is viewed from above, just like a real roll, so the face pointing up is the result. This makes it easy to read the number the same way you would with a physical die.",
  },
  {
    question: "Does the dice roller make sound?",
    answer:
      "Yes. Dice thud softly as they bounce on the table. You can switch the sound off with the speaker button at any time.",
  },
  {
    question: "Is the dice roller free, and does it work on a phone?",
    answer:
      "It is free, needs no account, and the page adapts to phones, tablets and computers.",
  },
];

export const SpinWheelArticle = {
  title: "How to Use a Spin the Wheel Decision Maker",
 
  intro:
    "When you cannot decide between options, or when you need a fair way to pick a winner, a spinning wheel takes the pressure off. Toolited's spin the wheel lets you type your own choices, spins with a ticking pointer for at least 8 seconds, and announces the winner with a celebration. It works for meals, games, giveaways, classroom activities and more.",
 
  sections: [
    {
      heading: "What is a spin the wheel tool?",
      paragraphs: [
        "A spin the wheel tool puts your options on the segments of a colorful wheel. When you spin it, the wheel turns, slows down and stops with the pointer on one segment. That segment is the winner.",
        "It turns a decision into a quick, fun moment that everyone can watch, which makes the result feel fair and easy to accept.",
      ],
    },
    {
      heading: "How to use the wheel",
      paragraphs: ["Setting up and spinning the wheel takes less than a minute."],
      bullets: [
        "Choose a preset such as Numbers, Colors, Yes / No or What to eat, or pick Custom.",
        "Type your options in the box, one per line. You can use between 2 and 20 options.",
        "Use the shuffle button to mix the order of the segments if you like.",
        "Press the spin button, or click the SPIN button in the center of the wheel.",
        "Watch the wheel spin for at least 8 seconds and read the winner when it stops.",
        "Spin again, or remove the winner from the wheel to pick the next one.",
      ],
    },
    {
      heading: "How does the wheel choose a winner?",
      paragraphs: [
        "When you press spin, the tool picks one option at random in your browser, with every option having an equal chance. The wheel animation is then played so it comes to rest on that result.",
        "The spin lasts from 8 to about 10 seconds, with a ticking pointer and flashing lights to build suspense. It is meant for fun and everyday decisions, not for lotteries or gambling.",
      ],
    },
    {
      heading: "Ideas for using a decision wheel",
      paragraphs: ["A random wheel is handy far beyond choosing dinner."],
      bullets: [
        "Picking what to eat, where to go or which movie to watch.",
        "Choosing a winner for a giveaway or a prize draw among friends.",
        "Selecting students to answer questions or present in class.",
        "Deciding who does a chore, who pays the bill or who goes first.",
        "Running team games, truth or dare, and party challenges.",
        "Making a quick choice when you are stuck between a few good options.",
      ],
    },
    {
      heading: "Tips for a better wheel",
      paragraphs: [
        "Keep option names short so they are easy to read on the wheel. Names are shortened when they are very long, and the font gets smaller as you add more segments, so around 8 to 12 options gives the clearest result.",
        "To pick several winners in a row, use the option to remove the winner from the wheel after each spin, so the same name does not come up twice.",
      ],
    },
  ],
 
  relatedTools: [
    { label: "Dice Roller", href: "/games/dice-roller" },
    { label: "Text Tool", href: "/text-tool" },
    { label: "Typing Tutor", href: "/typing-tutor" },
    { label: "Unit Converter", href: "/unit-converter" },
  ],
};

export const SpinWheelFAQ = [
  {
    question: "Is the spin the wheel fair?",
    answer:
      "Yes. Every option has an equal chance of winning, and the result is chosen at random in your browser each time you spin. It is fair for games and everyday decisions, but it should not be used for lotteries or gambling.",
  },
  {
    question: "How many options can I put on the wheel?",
    answer:
      "You can add between 2 and 20 options, one per line. For the clearest wheel, around 8 to 12 options works best.",
  },
  {
    question: "How long does the wheel spin for?",
    answer:
      "Every spin lasts at least 8 seconds, and up to about 10 seconds, so the wheel builds suspense and slows down gradually before it stops.",
  },
  {
    question: "Can I use my own names and choices?",
    answer:
      "Yes. Select Custom and type your own options, one per line. You can also start from a preset such as Numbers, Colors, Yes / No or What to eat and edit it.",
  },
  {
    question: "How do I pick more than one winner?",
    answer:
      "After a spin, use the button to remove the winner from the wheel, then spin again. Repeat this to pick as many different winners as you need.",
  },
  {
    question: "Does the wheel make sound?",
    answer:
      "Yes. The pointer ticks as it passes each segment, and a short tune plays when the winner is chosen. You can turn the sound off with the speaker button.",
  },
  {
    question: "Is it free, and does it work on a phone?",
    answer:
      "It is free, needs no account, and the wheel adapts to phones, tablets and computers.",
  },
];

export const GamesArticle = {
  id: "online-games-guide",
  title: "Make Quick Choices with a Dice Roller or Spin Wheel",
  intro:
    "Toolited's lightweight browser games offer simple ways to roll virtual dice or choose from a list of options. Use them for casual games, classroom activities, or everyday decisions.",
  sections: [
    {
      heading: "Roll standard or custom dice",
      paragraphs: [
        "Choose a six-sided die, a D20, a coin flip, or a custom die with a supported number of sides. The dice roller can roll multiple dice and show recent results.",
        "These rolls are for casual use and entertainment. They are not designed to provide cryptographically secure randomness for security, regulated draws, or other high-stakes decisions.",
      ],
    },
    {
      heading: "Create a wheel from your own options",
      paragraphs: [
        "Add choices to the spin wheel, customize its appearance, then spin to select an option. You can shuffle choices or remove a winner and review recent winners.",
        "The wheel requires at least two options and supports a limited list size. Use it as a fun selection aid, not as a certified or independently audited random drawing system.",
      ],
    },
  ],
  relatedTools: [
    { label: "Dice roller", href: "/games/dice-roller" },
    { label: "Spin wheel", href: "/games/spin-wheel" },
    { label: "All calculators", href: "/all-calculators" },
  ],
};

export const GamesFAQ = [
  {
    question: "Which games are available?",
    answer:
      "The games page links to a dice roller and a customizable spin wheel. The dice roller supports standard dice, a D20, a coin flip, and custom dice.",
  },
  {
    question: "Can I use my own choices on the spin wheel?",
    answer:
      "Yes. Enter one option per line, then spin the wheel. The wheel supports between 2 and 20 options.",
  },
  {
    question: "Are the results suitable for lotteries or security decisions?",
    answer:
      "No. These games are intended for casual use and entertainment, not for cryptographic security, regulated drawings, or high-stakes decisions.",
  },
  {
    question: "Can I remove a selected winner?",
    answer:
      "The spin wheel includes an option to remove the winner, which is useful when selecting among choices without replacement.",
  },
];

export const ImageCompressorArticle = {
  id: "image-compression-guide",
  title: "How to Compress Images Without Unnecessary Quality Loss",
  intro:
    "Large photos can take longer to upload, share, and display on a website. Toolited's online image compressor helps reduce JPEG, PNG, and WebP files in your browser, with controls to balance file size and image detail.",
  sections: [
    {
      heading: "Choose a format and compression level",
      paragraphs: [
        "Add up to 20 images at a time, with a maximum file size of 25 MB per image. Choose a compression mode or target size, then compare the result with the original before downloading. The best setting depends on how the image will be used.",
        "JPEG and WebP are often suitable for photographs. PNG can be useful when you need lossless image data or transparency. Converting between formats can affect transparency and visual quality, so check the output before replacing an original.",
      ],
    },
    {
      heading: "Keep image dimensions in mind",
      paragraphs: [
        "Compression changes how image data is stored; it does not necessarily resize an image. If the image is much larger than its display area, resize it with an image editor before compressing.",
        "The tool processes images in your browser. Save a copy of important originals and inspect fine details, text, and transparent areas in the downloaded files.",
      ],
    },
  ],
  relatedTools: [
    { label: "WebP to JPG or PNG", href: "/webp-to-image" },
    { label: "Background remover", href: "/background-remover" },
    { label: "Video compressor", href: "/video-compressor" },
  ],
};

export const ImageCompressorFAQ = [
  {
    q: "Can I compress multiple images at once?",
    a: "Yes. Add up to 20 images at a time, compress them all with the same settings, then download each one or everything together as a ZIP file.",
  },
  {
    q: "Is my image uploaded to a server?",
    a: "No. Compression runs entirely inside your browser, so your photos never leave your device.",
  },
  {
    q: "Which image formats are supported?",
    a: "JPEG, PNG and WebP images up to 25 MB each. You can also convert the output to WebP or JPEG for smaller files.",
  },
  {
    q: "How do I compress an image to a specific size like 100 KB?",
    a: "Add your images, enter a target size (for example 100 KB), choose a compression mode and click Compress. The tool lowers quality and dimensions until each image reaches the target.",
  },
  {
    q: "Will compressing reduce my image quality?",
    a: "Best Quality mode keeps images nearly identical to the original. Smallest Size trades some detail for the lowest possible file size.",
  },
];

export const ImagetoVectorArticle = {
  id: "image-to-svg-guide",
  title: "Convert Raster Images into SVG Vector Artwork",
  intro:
    "A vector image can scale without the same pixelation as a small raster image. Toolited's image-to-vector converter traces supported images into SVG paths, with controls to adjust the trace and preview the result.",
  sections: [
    {
      heading: "Prepare an image for tracing",
      paragraphs: [
        "Add a PNG, JPG, WebP, or GIF image, or paste an image into the tool. High-contrast artwork with clear edges often traces more cleanly than a detailed photograph with subtle gradients.",
        "Choose a color or black-and-white tracing mode and adjust the available vector settings. Preview the SVG at the size you expect to use and refine the settings if small shapes merge or edges become rough.",
      ],
    },
    {
      heading: "What an SVG trace preserves",
      paragraphs: [
        "Tracing converts raster pixels into vector paths; it does not recover the original design layers or source vector geometry. Complex photos may produce large, detailed paths rather than a clean, editable illustration.",
        "Download the SVG or copy its code for use in a compatible editor or website. Open the exported file in its destination app to check colors, dimensions, and rendering.",
      ],
    },
  ],
  relatedTools: [
    { label: "WebP to JPG or PNG", href: "/webp-to-image" },
    { label: "Background remover", href: "/background-remover" },
    { label: "QR code generator", href: "/qr-generator" },
  ],
};

export const ImagetoVectorFAQ = [
  {
    question: "What is the difference between a raster image and SVG?",
    answer:
      "Raster images store pixels, while SVG files describe vector paths and shapes. A trace approximates the pixels as paths; it does not recreate the original editable artwork.",
  },
  {
    question: "Which images are easiest to vectorize?",
    answer:
      "Logos, icons, and other images with clear edges and limited colors are often easier to trace than detailed photographs.",
  },
  {
    question: "Can I change the trace?",
    answer:
      "Yes. Choose a color or black-and-white mode, adjust the available trace settings, and preview the result before downloading.",
  },
  {
    question: "What can I do with the finished SVG?",
    answer:
      "Download the SVG file or copy its code into a compatible editor or web project, then inspect it in the app where you plan to use it.",
  },
];

export const InputTesterArticle = {
  id: "input-tester-guide",
  title: "Test Keyboard, Mouse, and Gamepad Inputs in Your Browser",
  intro:
    "Check whether your input devices are responding as expected with Toolited's interactive input tester. View keyboard presses, mouse actions, and supported controller input in one place.",
  sections: [
    {
      heading: "Check keyboard and mouse controls",
      paragraphs: [
        "Use the keyboard view to see detected key presses and check for rollover or keys that do not register as expected. The mouse tools can help test buttons, movement, wheel input, polling behavior, and click speed.",
        "Browser and operating-system shortcuts may be handled outside the webpage, so not every key can be captured in every context. Test the controls you need in the app or game where you plan to use them as well.",
      ],
    },
    {
      heading: "Connect a supported controller",
      paragraphs: [
        "The controller view can display detected gamepad buttons, sticks, triggers, and supported vibration. Connect a compatible controller and interact with it to see which inputs the browser reports.",
        "Controller support depends on your browser, operating system, device, and permissions. This is a diagnostic aid, not a guarantee that every controller or game will behave the same way.",
      ],
    },
  ],
  relatedTools: [
    { label: "Typing tutor", href: "/typing-tutor" },
    { label: "Games", href: "/games" },
  ],
};

export const InputTesterFAQ = [
  {
    question: "Can the tester check a game controller?",
    answer:
      "It can display input from supported gamepads through the browser. Connect the controller and interact with its controls; support depends on the device and browser.",
  },
  {
    question: "Why are some keyboard keys not detected?",
    answer:
      "Some keys are reserved by the browser or operating system and may not reach a webpage. Keyboard rollover also varies by hardware.",
  },
  {
    question: "Can I test mouse buttons and the scroll wheel?",
    answer:
      "Yes. The mouse tools are designed to show button, movement, and wheel input reported by the browser.",
  },
  {
    question: "Does a successful test guarantee the device works in every game?",
    answer:
      "No. Games and applications can handle input differently. Use the tester to diagnose browser-reported inputs, then verify the device in the software where you need it.",
  },
];

export const InvoiceGeneratorArticle = {
  id: "invoice-creation-guide",
  title: "Create and Download a Professional Invoice",
  intro:
    "Build an invoice with your business and client details, line items, payment terms, and totals using Toolited's online invoice generator. Adjust the document in your browser, then print or export it as a PDF.",
  sections: [
    {
      heading: "Add invoice details and calculate totals",
      paragraphs: [
        "Enter the invoice and contact details, add line items, and include relevant tax, discounts, deposits, late fees, or notes. Review quantities, rates, currency, and payment terms before sending the invoice.",
        "Use the preview to check how the information appears on the page. Clear descriptions and accurate due dates make it easier for a client to understand what is owed and when payment is expected.",
      ],
    },
    {
      heading: "Save or export your invoice",
      paragraphs: [
        "The generator supports saving invoices in the browser, creating a new invoice, printing, and PDF export. Saved drafts use local browser storage, so they are tied to the browser and device rather than automatically syncing to an account.",
        "Open the exported document before sharing it to confirm names, totals, and layout. If PDF export does not display a character or font correctly, use the print-to-PDF workflow offered by your browser.",
      ],
    },
  ],
  relatedTools: [
    { label: "Currency converter", href: "/currency-converter" },
    { label: "PDF tools", href: "/pdf-tools" },
    { label: "All calculators", href: "/all-calculators" },
  ],
};

export const InvoiceGeneratorFAQ = [
  {
    question: "Can I add tax, discounts, or deposits?",
    answer:
      "Yes. The invoice editor includes controls for line items and additional charges or adjustments such as tax, discounts, deposits, and late fees.",
  },
  {
    question: "How do I download or print an invoice?",
    answer:
      "Use the print or PDF export controls after reviewing the invoice preview. Open the resulting file to confirm its details and layout.",
  },
  {
    question: "Where are saved invoices stored?",
    answer:
      "Invoice drafts and saved invoices use your browser's local storage. They are not automatically synced across browsers or devices, so keep an exported copy of important invoices.",
  },
  {
    question: "Why do some characters look different in a PDF?",
    answer:
      "Some characters or fonts may not render as expected in the direct PDF export. Review the PDF and use your browser's print-to-PDF option if a character is missing or displayed incorrectly.",
  },
];

export const CompressPDFArticle = {
  id: "pdf-compression-guide",
  title: "Reduce PDF File Size with Image-Based Compression",
  intro:
    "A smaller PDF can be easier to upload and share. Toolited's PDF compressor offers low, medium, and high settings and processes the document in your browser. Its compression method is best suited to scanned or image-based documents.",
  sections: [
    {
      heading: "How this PDF compressor reduces file size",
      paragraphs: [
        "The tool renders PDF pages and recompresses them as images inside a new PDF. The compression level controls the balance between file size and visual quality: stronger compression can make a smaller file but may make text and fine details less clear.",
        "Because pages are converted to images, the compressed PDF may no longer contain selectable or searchable text. If preserving text, links, or vector detail matters, keep the original or choose a workflow that retains the PDF's text layer.",
      ],
    },
    {
      heading: "Compare the result before replacing your file",
      paragraphs: [
        "Try a moderate setting first, then compare the new file size and page clarity with your original. If the result is not smaller, the tool keeps the original rather than presenting a larger file as a successful compression.",
        "Open the downloaded PDF and check every page, especially small print, signatures, diagrams, and scans. Store an uncompressed original when you need future editing or archival quality.",
      ],
    },
  ],
  relatedTools: [
    { label: "PDF editor", href: "/pdf-tools/pdf-editor" },
    { label: "PDF to Word", href: "/pdf-tools/pdf-to-word" },
    { label: "PDF tools", href: "/pdf-tools" },
  ],
};

export const CompressPDFFAQ = [
  {
    question: "Will compressed PDF text stay selectable?",
    answer:
      "This compressor renders pages as images, so text in its output may not remain selectable or searchable. Keep the original when you need its text layer.",
  },
  {
    question: "Which compression level should I choose?",
    answer:
      "Start with a lower or medium setting and compare the file size and readability. Higher compression may reduce more detail, especially in small text and fine lines.",
  },
  {
    question: "Why did my PDF not get smaller?",
    answer:
      "A document that is already optimized may not shrink further. If compression would make the file larger, the tool keeps the original.",
  },
  {
    question: "Is this useful for scanned PDFs?",
    answer:
      "It is designed for image-based or scanned pages. Since pages are rasterized, it is not the best choice when selectable text or vector graphics must be preserved.",
  },
];

export const DocumentScannerArticle = {
  id: "image-to-pdf-guide",
  title: "Turn Photos and Scans into a PDF",
  intro:
    "Combine photos or scanned pages into a shareable PDF using Toolited's browser-based document scanner. Use a camera or supported image files, adjust page appearance, then export a multi-page document.",
  sections: [
    {
      heading: "Capture or add pages",
      paragraphs: [
        "Capture pages with a camera or add supported JPEG, PNG, or PDF input. Arrange multiple pages into one document, then use edge detection and perspective correction to make photographed pages easier to read.",
        "Cleanup filters and crop adjustments can help improve contrast and framing. Check each page preview for clipped edges, shadows, and missing content before exporting.",
      ],
    },
    {
      heading: "Export a PDF or image archive",
      paragraphs: [
        "Export scanned pages as a multi-page PDF or as images in a ZIP archive. Optional English OCR can add searchable text to supported scans, but OCR is a recognition step and may misread handwriting, low-contrast print, or unusual layouts.",
        "Open the exported file and check every page. For important records, compare it with the original paper or image so that names, dates, and numbers are accurate.",
      ],
    },
  ],
  relatedTools: [
    { label: "PDF editor", href: "/pdf-tools/pdf-editor" },
    { label: "Compress PDF", href: "/pdf-tools/compress" },
    { label: "PDF tools", href: "/pdf-tools" },
  ],
};

export const DocumentScannerFAQ = [
  {
    question: "Can I scan several pages into one PDF?",
    answer:
      "Yes. Add or capture multiple pages, review their order, and export them together as a multi-page PDF.",
  },
  {
    question: "Can I use a phone camera?",
    answer:
      "The scanner can use a camera when your browser and device grant camera permission. You can also add supported image files instead.",
  },
  {
    question: "Will the PDF have searchable text?",
    answer:
      "Optional English OCR can recognize text in scans. OCR is not perfect, so check the resulting text when accuracy matters.",
  },
  {
    question: "Can I export the scanned pages as images?",
    answer:
      "Yes. The scanner can export page images in a ZIP archive as an alternative to a multi-page PDF.",
  },
];

export const PDFEditorArticle = {
  id: "pdf-editing-guide",
  title: "Edit, Organize, and Annotate PDF Files",
  intro:
    "Toolited's browser-based PDF editor brings common document tasks into one workspace. Add files, arrange pages, mark up content, and export an updated PDF without installing a desktop editor.",
  sections: [
    {
      heading: "Organize pages and combine documents",
      paragraphs: [
        "Reorder, rotate, or remove pages, and combine PDFs or supported images into a document. Review the page order and orientation before saving, particularly when working with multi-page files.",
        "Use page-level changes for document cleanup, or split a document when you need to share only selected pages. Keep the original so you can return to the unedited version.",
      ],
    },
    {
      heading: "Add text, marks, and signatures",
      paragraphs: [
        "The editor supports text changes, annotations, drawing, signatures, search, and redaction-style marks. Check the exported document at normal and zoomed sizes to make sure edits and marks appear where intended.",
        "If you use a redaction tool for sensitive information, verify the exported PDF carefully before sharing. Do not rely on a visual mark alone as proof that confidential content has been securely removed.",
      ],
    },
  ],
  relatedTools: [
    { label: "Compress PDF", href: "/pdf-tools/compress" },
    { label: "Image to PDF", href: "/pdf-tools/image-to-pdf" },
    { label: "PDF tools", href: "/pdf-tools" },
  ],
};

export const PDFEditorFAQ = [
  {
    question: "Can I reorder or remove PDF pages?",
    answer:
      "Yes. The editor includes page organization controls for reordering, rotating, and deleting pages. Review the page thumbnails before exporting.",
  },
  {
    question: "Can I add a signature or notes?",
    answer:
      "The editor supports signatures and annotations. Inspect the exported PDF to confirm their placement and appearance.",
  },
  {
    question: "Does the PDF editor work offline?",
    answer:
      "The editor runs in your browser, but some required resources may need to load first. Keep the page open while editing and exporting.",
  },
  {
    question: "Are redaction marks guaranteed to remove hidden text?",
    answer:
      "Do not assume a visible mark securely removes underlying data. Review the exported file with a trusted redaction workflow before sharing sensitive documents.",
  },
];

export const PdftoExcelArticle = {
  title: "How to Convert PDF Tables to Excel Online",

  intro:
    "Tables locked inside a PDF are frustrating: you can't sort them, add formulas, or paste them into a spreadsheet without everything landing in one column. Toolited's PDF to Excel converter finds the tables in your PDF and rebuilds them as an editable Excel (XLSX) or CSV file, with numbers converted to real numbers you can calculate with. It runs in your browser, so your document stays on your device.",

  sections: [
    {
      heading: "What does a PDF to Excel converter do?",
      paragraphs: [
        "A PDF doesn't store tables as rows and columns. It only stores pieces of text at fixed positions on the page. A PDF to Excel converter looks at where that text sits, works out which pieces line up into columns and rows, and writes them into spreadsheet cells.",
        "The result is a real .xlsx file you can open in Microsoft Excel, Google Sheets, LibreOffice, or Numbers, then sort, filter, and use in formulas, pivot tables, and charts.",
      ],
      bullets: [
        "Tables detected from aligned columns and rows of text.",
        "Numbers, negatives in brackets, and percentages converted to real values.",
        "Wrapped cell text and merged header cells recognized.",
        "A styled header row, table borders, frozen header, and automatic column widths.",
        "Scanned pages read with OCR.",
        "Export to Excel (.xlsx) or CSV.",
      ],
    },
    {
      heading: "How to convert a PDF to Excel",
      paragraphs: [
        "You can convert a file in a few steps and adjust the options to suit your document.",
      ],
      bullets: [
        "Open the PDF to Excel tool and choose your PDF, or drag and drop it onto the page.",
        "If the PDF is password protected, enter the password to unlock it.",
        "Choose the pages to convert: all pages or a custom range such as 1-3, 5, 8-10.",
        "Pick what to extract (tables only, or tables plus other text) and how sheets are arranged.",
        "Click Convert, preview the sheets, and download your Excel or CSV file.",
      ],
    },
    {
      heading: "Numbers that work in Excel, not just text",
      paragraphs: [
        "Copying a table from a PDF often gives you text that looks like numbers but won't add up. This converter turns values such as 1,234.50, (45), and 12% into real numbers, so totals, averages, and formulas work straight away. Negative numbers in brackets become negative values, and percentages keep their percent format.",
        "Values that should stay as text, such as codes with leading zeros like 007, are kept as they are. If you would rather keep every value as plain text, you can turn number conversion off.",
      ],
    },
    {
      heading: "Choosing how your sheets are arranged",
      paragraphs: [
        "Different documents suit different layouts, so you can choose how the tables are placed in the workbook.",
      ],
      bullets: [
        "One sheet per page: each PDF page becomes its own sheet, handy for reports.",
        "One sheet per table: every detected table gets a separate sheet, ideal for clean data.",
        "Everything on one sheet: all tables are stacked together. Tables that continue across pages are joined into one, and repeated header rows are removed.",
      ],
    },
    {
      heading: "Can you convert a scanned PDF to Excel?",
      paragraphs: [
        "A scanned PDF is a picture of a page, so there is no text to read. The converter uses OCR (optical character recognition) to recognize the words in the image, then applies the same table detection to rebuild rows and columns.",
        "Auto-detect runs OCR only on pages without selectable text, which keeps normal PDFs fast. You can also run it on every page and pick the document language, including English, Urdu, Arabic, Hindi, Spanish, French, German, and more. Clear, straight, high-resolution scans give the best results, and you should always check scanned numbers before relying on them.",
      ],
    },
    {
      heading: "How to get the best results from your tables",
      paragraphs: [
        "Table detection works best on PDFs created digitally, such as exports from accounting software, bank statements, reports, or Word and Excel files saved as PDF. Heavily designed layouts and photographed pages are harder.",
        "If columns end up merged together, switch column detection to \"Tight columns\". If a single cell gets split across several columns, try \"Wide gaps only\". Preview the result before using it, and spot-check totals against the original PDF.",
      ],
    },
    {
      heading: "Is it safe to convert a PDF to Excel online?",
      paragraphs: [
        "Privacy depends on how a tool handles your file. Many online converters upload documents to a server. Toolited's PDF to Excel converter processes the file in your browser, so your financial statements, invoices, and reports stay on your device while they are converted.",
        "Even so, check a tool's privacy information before working with sensitive data, and avoid confidential files on shared or public computers.",
      ],
    },
    {
      heading: "When should you convert PDF to Excel?",
      paragraphs: [
        "Convert a PDF to Excel whenever the data inside it needs to be analyzed, sorted, or reused.",
      ],
      bullets: [
        "Turning bank or credit card statements into data you can sort and total.",
        "Moving invoices, price lists, and order tables into a spreadsheet.",
        "Extracting financial reports, schedules, or results tables for analysis.",
        "Importing data into accounting software, databases, or other tools through CSV.",
        "Digitizing printed or scanned tables.",
      ],
    },
  ],

  relatedTools: [
    { label: "PDF to Word", href: "/pdf-tools/pdf-to-word" },
    { label: "Compress PDF", href: "/pdf-tools/compress" },
    { label: "PDF Editor", href: "/pdf-tools/pdf-editor" },
    { label: "Image to PDF", href: "/pdf-tools/image-to-pdf" },
  ],
};

export const PdftoExcelFAQ = [
  {
    question: "How do I convert a PDF to Excel?",
    answer:
      "Choose your PDF, select the pages and options you want, and click Convert. The tool detects the tables and creates an Excel (.xlsx) or CSV file that you can download and open in Excel, Google Sheets, or LibreOffice.",
  },
  {
    question: "Will the numbers work in formulas?",
    answer:
      "Yes. Values such as 1,234.50, (45), and 12% are converted to real numbers, so you can sum, sort, and use them in formulas straight away. Codes with leading zeros, like 007, stay as text so they aren't changed.",
  },
  {
    question: "Can I convert a scanned PDF to Excel?",
    answer:
      "Yes. Scanned pages are read with OCR and then run through the same table detection. Auto-detect applies OCR only to pages without selectable text, or you can use it on every page. Clear, high-resolution scans work best, and OCR numbers should be double-checked.",
  },
  {
    question: "Are my PDF files uploaded to a server?",
    answer:
      "No. The conversion runs in your browser, so your file stays on your device while it is processed. This applies to the tools on this page.",
  },
  {
    question: "Why are some columns merged or split incorrectly?",
    answer:
      "Tables in a PDF are only text at fixed positions, so the tool has to guess where columns begin and end. If columns are merged together, try \"Tight columns\". If one cell is split into several, try \"Wide gaps only\". Previewing the result helps you pick the right setting.",
  },
  {
    question: "Can I choose how the sheets are arranged?",
    answer:
      "Yes. You can create one sheet per PDF page, one sheet per table, or put everything on a single sheet. On a single sheet, tables that continue across pages are joined and repeated header rows are removed.",
  },
  {
    question: "Should I choose XLSX or CSV?",
    answer:
      "Choose XLSX if you want formatting, such as a styled header, borders, frozen header row, merged cells, and several sheets. Choose CSV for a simple, plain file that is easy to import into databases, accounting tools, or other software.",
  },
  {
    question: "Can I convert a password-protected PDF?",
    answer:
      "Yes, if you know the password. Enter it when prompted and the tool will unlock the file for conversion. It cannot open a protected PDF without the correct password.",
  },
  {
    question: "Can I convert only some pages of a PDF?",
    answer:
      "Yes. Choose a custom page range, such as 1-3, 5, or 8-10, to convert only the pages you need instead of the whole document.",
  },
  {
    question: "Does it work on tables without visible lines?",
    answer:
      "Yes. Tables are detected from how the text lines up into rows and columns, not from drawn borders, so tables without grid lines usually work too. Very irregular layouts may need a different column detection setting or some cleanup in Excel.",
  },
  {
    question: "Can I use the PDF to Excel converter on my phone?",
    answer:
      "Yes. The tool works on phones and tablets, though large or scanned PDFs convert faster and are easier to check on a computer.",
  },
];

export const PdftoWordArticle = {
  title: "How to Convert a PDF to an Editable Word Document Online",

  intro:
    "A PDF is great for sharing, but hard to change. When you need to update a contract, reuse text from a report, or fix a typo in a resume, converting the PDF to Word (DOCX) lets you edit it like any other document. Toolited's PDF to Word converter rebuilds your PDF's text, formatting, tables, lists, and images into an editable Word file, and it runs in your browser so your document stays on your device.",

  sections: [
    {
      heading: "What does a PDF to Word converter do?",
      paragraphs: [
        "A PDF stores each line of text at a fixed position on the page, so it has no real paragraphs, lists, or tables. A PDF to Word converter reads those positions and fonts and rebuilds the document structure: it groups lines into paragraphs, recognizes headings and bullet lists, detects tables, and places images where they appeared in the original.",
        "The result is a standard .docx file you can open in Microsoft Word, Google Docs, LibreOffice, or Pages and edit freely.",
      ],
      bullets: [
        "Text with fonts, sizes, bold, italic, underline, and strikethrough.",
        "Headings, bullet lists, and numbered lists.",
        "Tables detected from aligned columns of text.",
        "Images and horizontal lines kept in position.",
        "Original page size, page breaks, headers, footers, and page numbers.",
        "Two-column pages and right-to-left languages such as Urdu and Arabic.",
      ],
    },
    {
      heading: "How to convert a PDF to Word",
      paragraphs: [
        "Converting a file takes only a few steps, and you can adjust the options before you start.",
      ],
      bullets: [
        "Open the PDF to Word tool and choose your PDF, or drag and drop it onto the page.",
        "If the PDF is password protected, enter the password to unlock it.",
        "Pick the pages to convert: all pages or a custom range such as 1-3, 5, 8-10.",
        "Choose your options, such as table detection, keeping pictures, and keeping the original page layout.",
        "Click Convert, then download the Word file. You can preview the first pages before opening it in Word.",
      ],
    },
    {
      heading: "Can you convert a scanned PDF to Word?",
      paragraphs: [
        "A scanned PDF is really a picture of a page, so there is no text to copy. To make it editable, the converter uses OCR (optical character recognition) to read the text from the image and place it in the Word file.",
        "Auto-detect mode runs OCR only on pages that have no selectable text, which keeps normal PDFs fast. You can also force OCR for every page and choose the document language, including English, Urdu, Arabic, Hindi, Spanish, French, German, and more. For the best results, start from a clear, straight, high-resolution scan.",
      ],
    },
    {
      heading: "How to get the best formatting after conversion",
      paragraphs: [
        "Word and PDF lay out text differently, so small differences in line breaks are normal. A few habits help you get a result that is close to the original.",
        "PDFs created digitally, such as exports from Word or Google Docs, convert more accurately than scans or heavily designed brochures. Turn on table detection for documents with grids of data, and keep the original page size when you want pages to match the PDF. Turn it off if you would rather have one flowing document that is easier to edit.",
        "After converting, scroll through the Word file and check headings, tables, and images, especially in complex or highly designed layouts.",
      ],
    },
    {
      heading: "Is it safe to convert a PDF to Word online?",
      paragraphs: [
        "Privacy depends on how a tool processes your file. Many online converters upload your document to a server. Toolited's PDF to Word converter processes the file in your browser, so your document stays on your device while it is converted.",
        "As with any tool, check the privacy information before working with sensitive documents, and avoid using shared or public computers for confidential files.",
      ],
    },
    {
      heading: "When should you convert PDF to Word?",
      paragraphs: [
        "Converting makes sense whenever you need to change content rather than just read it.",
      ],
      bullets: [
        "Updating a resume, cover letter, or contract you only have as a PDF.",
        "Copying text, tables, or lists from a report into another document.",
        "Translating or proofreading a document in Word.",
        "Turning a scanned page or a printed form into editable text.",
        "Reusing content from a brochure, manual, or study material.",
      ],
    },
  ],

  relatedTools: [
    { label: "PDF to Excel", href: "/pdf-tools/pdf-to-excel" },
    { label: "Compress PDF", href: "/pdf-tools/compress" },
    { label: "PDF Editor", href: "/pdf-tools/pdf-editor" },
    { label: "Image to PDF", href: "/pdf-tools/image-to-pdf" },
  ],
};

export const PdftoWordFAQ = [
  {
    question: "How do I convert a PDF to Word?",
    answer:
      "Choose your PDF, select the pages and options you want, and click Convert. The tool creates an editable DOCX file that you can download and open in Word, Google Docs, or LibreOffice.",
  },
  {
    question: "Will my formatting stay the same after converting?",
    answer:
      "The converter keeps fonts, sizes, bold and italic text, headings, lists, tables, images, and page size as closely as it can. Because PDF and Word handle layout differently, some line breaks or spacing may vary, especially in complex designs. Digitally created PDFs convert most accurately.",
  },
  {
    question: "Can I convert a scanned PDF or an image-based PDF?",
    answer:
      "Yes. Scanned pages are read with OCR so the text becomes editable. Auto-detect applies OCR only to pages without selectable text, or you can run it on every page. Clear, high-resolution scans give the most accurate text.",
  },
  {
    question: "Are my PDF files uploaded to a server?",
    answer:
      "No. The conversion runs in your browser, so your file stays on your device while it is processed. This applies to the tools on this page.",
  },
  {
    question: "Can I convert a password-protected PDF?",
    answer:
      "Yes, if you know the password. Enter it when prompted and the tool will unlock the file for conversion. It cannot open a protected PDF without the correct password.",
  },
  {
    question: "Does it support languages like Urdu and Arabic?",
    answer:
      "Yes. Right-to-left text such as Urdu, Arabic, and Hebrew is written right to left in the Word file. For scanned pages, select the matching OCR language so the text is recognized correctly.",
  },
  {
    question: "Can I convert only some pages of a PDF?",
    answer:
      "Yes. Choose a custom page range, such as 1-3, 5, or 8-10, to convert only the pages you need instead of the whole document.",
  },
  {
    question: "Why does my Word file look slightly different from the PDF?",
    answer:
      "PDFs fix every line in place, while Word reflows text depending on fonts and page settings. If a font isn't installed on your computer, Word substitutes a similar one, which can shift line breaks. Installing the original font or checking the result in Word usually fixes it.",
  },
  {
    question: "Can I use the PDF to Word converter on my phone?",
    answer:
      "Yes. The tool works on phones and tablets, though converting very large or image-heavy PDFs is usually faster and easier on a computer.",
  },
];

export const PDFToolsArticle = {
  title: "How to Work with PDF Files Online",

  intro:
    "PDF files are useful for sharing documents while keeping their layout consistent across devices. Toolited brings together PDF editing, compression, and conversion tools so you can choose the right workflow for your document.",

  sections: [
    {
      heading: "What can you do with PDF files?",
      paragraphs: [
        "Different PDF tasks solve different problems. You may need to reduce a large document before sending it, combine a document with images, or convert its contents into an editable format.",
      ],
      bullets: [
        "Compress a PDF to reduce its file size.",
        "Edit a PDF when you need to make document changes.",
        "Convert images into a PDF for easier sharing.",
        "Convert PDF documents to Word or Excel when supported by the selected tool.",
      ],
    },
    {
      heading: "How to choose the right PDF tool",
      paragraphs: [
        "Start by identifying what you need to change. If the document is too large to email, use a compressor. If you need to work with its text or tables in another application, choose the appropriate conversion tool.",
        "After processing, open the resulting file and check that its text, layout, images, and formatting meet your needs.",
      ],
    },
    {
      heading: "Are online PDF tools safe to use?",
      paragraphs: [
        "File privacy depends on how the particular tool processes documents. Check its privacy information before uploading sensitive files, and verify whether processing takes place in your browser or on a remote server.",
      ],
    },
  ],

  relatedTools: [
    { label: "Compress PDF", href: "/pdf-tools/compress" },
    { label: "PDF Editor", href: "/pdf-tools/pdf-editor" },
    { label: "Image to PDF", href: "/pdf-tools/image-to-pdf" },
    { label: "Image Compressor", href: "/image-compressor" },
  ],
};

export const PDFToolsFAQ = [
  {
    question: "Which PDF tasks can I do here?",
    answer:
      "Open the PDF editor, compress a document, convert images to PDF, or convert a PDF to Word or Excel. Choose a tool above to get started.",
  },
  {
    question: "Are my documents uploaded?",
    answer:
      "PDF processing runs in your browser for the tools on this page. Your files remain on your device while you work with them.",
  },
  {
    question: "Can I use these PDF tools on a phone?",
    answer:
      "Yes. The tool pages adapt to smaller screens, though editing or arranging many pages is usually easier on a larger display.",
  },
];

export const QRGeneratorArticle = {
  id: "qr-code-guide",
  title: "Create a QR Code Online: Types, Styling, and Downloads",
  intro:
    "Make a QR code for a link or useful contact information with Toolited's free QR code generator. Choose what the code should open, customize its appearance, then download a file you can share or print.",
  sections: [
    {
      heading: "Choose what your QR code contains",
      paragraphs: [
        "Create codes for websites, plain text, email addresses, phone numbers, SMS, WhatsApp, Wi-Fi networks, and locations. Enter the details for the option you choose, and the generator creates a code that compatible QR readers can scan.",
        "Before sharing, scan the finished code with a phone. Check that the link or contact information is correct and that the destination opens as expected.",
      ],
    },
    {
      heading: "Customize and download your code",
      paragraphs: [
        "Adjust colors and add a logo to make the code fit a page, label, or brand. Keep strong contrast between the code and its background, and leave the quiet space around the edges clear so scanners can find the pattern.",
        "Download the QR code in a format suited to your project. For print, test a sample at the size you plan to use; for digital sharing, check it on a second screen before publishing.",
      ],
    },
  ],
  relatedTools: [
    { label: "Image to vector", href: "/image-to-vector" },
    { label: "Text tools", href: "/text-tool" },
  ],
};

export const QRGeneratorFAQ = [
  {
    question: "What can I put in a QR code?",
    answer:
      "Create QR codes for websites, plain text, email, phone numbers, SMS, WhatsApp, Wi-Fi networks, and map locations.",
  },
  {
    question: "How do I download and use my QR code?",
    answer:
      "Enter the content, customize the design if you like, then choose PNG, JPEG, SVG, or PDF. Scan the exported code with your phone before printing or sharing it.",
  },
  {
    question: "Can I add a logo and change the colors?",
    answer:
      "Yes. Customize the foreground and background colors, choose a dot style, and add a logo. Keep strong contrast and test the result so phones can scan it reliably.",
  },
  {
    question: "Does a generated QR code expire?",
    answer:
      "The code stores the information you enter, so it does not expire. A website QR code will only work while its destination URL remains available.",
  },
];

export const ScientificCalculatorArticle = {
  title: "How to Use an Online Scientific Calculator",

  intro:
    "A scientific calculator goes beyond basic arithmetic. It handles trigonometry, logarithms, powers, roots, fractions, equations, statistics, and more. Toolited's free online scientific calculator brings these functions into your browser, so you can solve homework, engineering, and everyday math problems on a phone, tablet, or computer without installing anything.",

  sections: [
    {
      heading: "What can a scientific calculator do?",
      paragraphs: [
        "A scientific calculator is built for problems that a standard calculator cannot solve in one step. You can type a full expression, check it on screen, and then get the result, instead of working out each part separately.",
      ],
      bullets: [
        "Calculate sin, cos, tan, and their inverse and hyperbolic versions in degrees, radians, or gradians.",
        "Work with logarithms, natural logs, powers, roots, factorials, permutations, and combinations.",
        "Enter and display fractions and mixed numbers in natural, stacked form.",
        "Solve quadratic and cubic equations, and systems with two or three unknowns.",
        "Compute definite integrals, derivatives, and summations.",
        "Work with matrices, statistics tables, and regression.",
        "Convert between number bases (decimal, binary, octal, hexadecimal) and between common units.",
        "Insert physical constants such as the speed of light or the gas constant.",
      ],
    },
    {
      heading: "How to use the calculator step by step",
      paragraphs: [
        "Type your expression using the on-screen keys or your keyboard, then press equals. Use brackets to control the order of operations, and use the arrow keys to move through the expression and fix mistakes.",
        "Many keys have a second function printed above them. Press SHIFT to use the yellow function, or ALPHA to use the red letter, which is handy for storing values in variables like A, B, or X.",
        "Before you start trigonometry, open SETUP and check that the angle unit matches your problem. Mixing up degrees and radians is the most common cause of wrong answers.",
      ],
    },
    {
      heading: "Tips for getting accurate results",
      paragraphs: [
        "Check the angle unit first, add brackets whenever an expression could be read in more than one way, and use the Ans key to reuse your last result instead of retyping it.",
        "For repeated calculations with different numbers, use the CALC function: enter the expression once with variables, and the calculator asks you for the values each time.",
      ],
    },
    {
      heading: "Using it on a phone or in a separate window",
      paragraphs: [
        "On a phone, the calculator uses a compact portrait layout. On a desktop, it opens in a wide landscape layout, and you can switch between the two at any time. You can also pop the calculator out into its own small window and keep it next to your notes, spreadsheet, or document while you work.",
      ],
    },
    {
      heading: "Is an online calculator accurate enough for study and work?",
      paragraphs: [
        "It is suitable for homework, revision, and general technical work. For exams, always check what your institution allows, and for safety-critical or financial decisions, verify important results with a second method.",
      ],
    },
  ],

  relatedTools: [
    { label: "Percentage Calculator", href: "/all-calculators" },
    { label: "Unit Converter", href: "/all-calculators" },
    { label: "Age Calculator", href: "/all-calculators" },
    { label: "Unit Convertor", href: "/unit-converter" },
  ],
};

export const ScientificCalculatorFAQ = [
  {
    question: "Is this scientific calculator free to use?",
    answer:
      "Yes. You can use it as often as you like without creating an account or installing an app.",
  },
  {
    question: "What functions does it support?",
    answer:
      "It supports trigonometric, logarithmic, power, and root functions, factorials, fractions, integrals, derivatives, summations, and the equation, matrix, statistics, table, and number-base modes. It also includes physical constants and unit conversion.",
  },
  {
    question: "How do I switch between degrees and radians?",
    answer:
      "Press SHIFT and then MODE to open SETUP, then choose Degree, Radian, or Gradian under the angle unit. The current unit is shown at the top of the screen.",
  },
  {
    question: "Can I solve equations with this calculator?",
    answer:
      "Yes. Open the Equation mode to solve quadratic and cubic equations or systems with two or three unknowns. You can also type an equation with X and use SOLVE for a single unknown.",
  },
  {
    question: "Does it work on my phone?",
    answer:
      "Yes. On mobile it uses a portrait layout designed for smaller screens. On desktop you can choose between portrait and landscape.",
  },
  {
    question: "Can I keep the calculator open while I work in another window?",
    answer:
      "Yes. On desktop, use the Pop out button to open the calculator in its own small window. Browsers that support floating windows keep it on top of your other work.",
  },
  {
    question: "Are my calculations stored or uploaded?",
    answer:
      "The calculator runs in your browser, so your expressions and results are processed on your device.",
  },
];

export const TexttoolArticle = {
  id: "online-text-tools-guide",
  title: "Transform, Clean, and Analyze Text Online",
  intro:
    "Toolited's text workspace brings common text transformations and utilities together. Search or filter the available tools, enter text, and copy the result when it is ready.",
  sections: [
    {
      heading: "Find the right text operation",
      paragraphs: [
        "Use text tools for transformations, cleanup, line operations, encoding, and counts. Search or browse categories to find an operation, then review the output before copying it into another app.",
        "Text conversions can change capitalization, whitespace, line breaks, or special characters. Keep a copy of the input when editing content that you cannot easily recreate.",
      ],
    },
    {
      heading: "Work with text in your browser",
      paragraphs: [
        "The page saves the selected tool and up to 100,000 input characters in the browser's local storage to support continued work in that browser. Clear browser storage if you need to remove saved local input.",
        "Avoid entering passwords, private keys, or other sensitive material into general-purpose text tools. Check the final text for formatting or encoding changes before publishing or sharing.",
      ],
    },
  ],
  relatedTools: [
    { label: "Typing tutor", href: "/typing-tutor" },
    { label: "QR code generator", href: "/qr-generator" },
  ],
};

export const TexttoolFAQ = [
  {
    question: "What can I do with the text tools?",
    answer:
      "The workspace includes text transformations, cleanup, line operations, encoding, and counting tools. Search or filter the list to find a specific operation.",
  },
  {
    question: "Can I copy the processed text?",
    answer:
      "Yes. Review the result and use the copy control to move it to another app.",
  },
  {
    question: "Does the tool remember my text?",
    answer:
      "The selected tool and up to 100,000 input characters are saved in your browser's local storage. Clear local browser data if you want to remove that saved input.",
  },
  {
    question: "Will text conversion preserve all formatting?",
    answer:
      "Some operations change spacing, line breaks, or characters by design. Review the output before using it, and keep the original if formatting is important.",
  },
];

export const TypingtutorArticle = {
  id: "typing-practice-guide",
  title: "Improve Typing Speed and Accuracy with Guided Practice",
  intro:
    "Regular, focused practice can help build more consistent touch-typing habits. Toolited's free typing tutor combines lessons, timed tests, custom text, and progress feedback in one browser workspace.",
  sections: [
    {
      heading: "Practice with lessons and typing tests",
      paragraphs: [
        "Choose lessons to practice key positions, or take a test using a time limit, word count, quote, code, or custom text. The tutor reports measures such as words per minute and accuracy so you can see how a session went.",
        "Start at a comfortable pace and focus on correct keystrokes before trying to type faster. Short, repeatable sessions can make it easier to notice which keys need more practice.",
      ],
    },
    {
      heading: "Use results to guide your next session",
      paragraphs: [
        "Review your accuracy and weak-key feedback, then use focused drills to practice the keys that cause mistakes. Compare results across similar tests rather than treating one score as a complete measure of typing ability.",
        "The tutor saves settings and progress in your browser's local storage. This can make them available on the same browser later, but it does not automatically sync them across devices.",
      ],
    },
  ],
  relatedTools: [
    { label: "Text tools", href: "/text-tool" },
    { label: "Keyboard input tester", href: "/input-tester" },
  ],
};

export const TypingtutorFAQ = [
  {
    question: "How is typing speed measured?",
    answer:
      "The tutor reports words per minute along with accuracy for a test session. Scores depend on the selected test and duration, so compare like with like.",
  },
  {
    question: "Can I practice with my own text?",
    answer:
      "Yes. Choose a custom test and enter text you want to practice, or use the available lesson and test modes.",
  },
  {
    question: "Does my typing progress sync to another device?",
    answer:
      "Settings and progress are stored in the browser's local storage. They may not transfer to another browser or device.",
  },
  {
    question: "Should I prioritize speed or accuracy?",
    answer:
      "Build accuracy and consistent finger placement first, then gradually increase speed. The tutor's feedback can help identify keys to practice.",
  },
];

export const UnitconverterArticle = {
  id: "unit-conversion-guide",
  title: "Convert Measurements Between Common Units",
  intro:
    "Use the online unit converter to move between measurement systems without doing the arithmetic by hand. Select a category, enter a value, and choose the units you want to convert between.",
  sections: [
    {
      heading: "Convert more than basic measurements",
      paragraphs: [
        "The converter includes categories such as length, weight, temperature, area, volume, speed, time, data storage, pressure, energy, and power, along with specialist categories for everyday measurements.",
        "For a reliable result, choose the exact units shown in the tool and double-check the source value. Temperature conversions use different formulas from simple scale factors, so select the correct temperature units rather than estimating a ratio.",
      ],
    },
    {
      heading: "Check context-specific conversions",
      paragraphs: [
        "Some conversions depend on context rather than a universal fixed ratio. Cooking volume-to-weight conversions depend on the selected ingredient's density, while typography conversions can depend on DPI and font-size settings.",
        "Use converted values as a practical aid and verify precision requirements for engineering, laboratory, financial, or other high-stakes work.",
      ],
    },
  ],
  relatedTools: [
    { label: "Currency converter", href: "/currency-converter" },
    { label: "All calculators", href: "/all-calculators" },
  ],
};

export const UnitconverterFAQ = [
  {
    question: "Which measurements can I convert?",
    answer:
      "Convert common units for length, mass, temperature, volume, area, speed, time, data, pressure, energy, power, and more, including typography and cooking measurements.",
  },
  {
    question: "How do I convert between temperature units?",
    answer:
      "Choose the Temperature category, enter a value, then select the starting and target units. Celsius, Fahrenheit, and Kelvin conversions use their proper temperature formulas.",
  },
  {
    question: "Can I copy a conversion result?",
    answer:
      "Yes. Use the copy control beside a result when it is available, then paste the converted value into another app or document.",
  },
];

export const VideoCompressorArticle = {
  id: "video-compression-guide",
  title: "Compress a Video for Easier Sharing",
  intro:
    "Reduce a video's file size when it is difficult to upload, send, or store. Toolited's browser-based video compressor lets you choose a target-size preset and output resolution, then exports the compressed video as an MP4.",
  sections: [
    {
      heading: "Choose a practical output size",
      paragraphs: [
        "Add a supported MP4, MOV, AVI, WebM, or MKV video up to 500 MB. Choose a target-size preset and an output resolution, such as 1080p, 720p, 480p, or 360p. Lower resolutions and smaller target sizes can reduce detail as well as file size.",
        "The right settings depend on where the video will be viewed. Keep the original resolution when detail matters, and use a smaller size when upload limits or bandwidth are the priority.",
      ],
    },
    {
      heading: "Allow time for browser-based encoding",
      paragraphs: [
        "Video encoding runs in the browser using WebAssembly. Processing time and memory use depend on the video's length, resolution, device, and selected settings; large files can take a while or exceed a device's available memory.",
        "Preview the exported MP4 and check its audio, picture quality, and file size before sharing. Keep your original file until the compressed version has been verified.",
      ],
    },
  ],
  relatedTools: [
    { label: "Image compressor", href: "/image-compressor" },
    { label: "Image and video tools", href: "/image-video-compressor" },
  ],
};

export const VideoCompressorFAQ = [
  {
    q: "Are my videos uploaded to a server?",
    a: "No. Compression runs entirely in your browser using WebAssembly, so your videos never leave your device.",
  },
  {
    q: "Which video formats are supported?",
    a: "MP4, MOV, AVI, WebM and MKV files up to 500 MB. The compressed result is exported as MP4, which plays almost everywhere.",
  },
  {
    q: "How do I compress a video to a specific size?",
    a: "Upload your video, enter a target size such as 25 MB, optionally lower the resolution, then click Compress. The tool adjusts the bitrate to land near your target.",
  },
  {
    q: "Why is compression slow on my device?",
    a: "Video encoding in the browser uses your CPU, so longer or higher-resolution videos take more time. Keep the tab open until it finishes.",
  },
];

export const WebptoImgArticle = {
  id: "webp-conversion-guide",
  title: "Convert WebP Images to JPG or PNG",
  intro:
    "Convert WebP files to JPG or PNG when an app, document, or workflow needs a different image format. Toolited processes images in your browser and supports batch conversion with optional size and output controls.",
  sections: [
    {
      heading: "Pick the output format for your image",
      paragraphs: [
        "Choose JPG for photographs when a smaller file is useful, or PNG when you need lossless output or transparency. For JPG, adjust image quality and choose a background color because JPG does not preserve transparency.",
        "You can also set a maximum image dimension and download results individually or together as a ZIP file. Check the output dimensions and appearance before using converted files in a project.",
      ],
    },
    {
      heading: "What happens to animated WebP files?",
      paragraphs: [
        "Converting an animated WebP produces a still frame, not an animated JPG or PNG. Use a dedicated animation or video workflow if you need to preserve motion.",
        "The conversion runs locally in the browser. Keep the original WebP if you may need its animation, transparency, or original image data later.",
      ],
    },
  ],
  relatedTools: [
    { label: "Image compressor", href: "/image-compressor" },
    { label: "Image to vector", href: "/image-to-vector" },
  ],
};

export const WebptoImgFAQ = [
  {
    question: "Can I convert multiple WebP images at once?",
    answer:
      "Yes. Add several WebP files, choose JPG or PNG, and download the converted images individually or together as a ZIP.",
  },
  {
    question: "What happens to transparent areas when converting to JPG?",
    answer:
      "JPG does not support transparency, so transparent pixels are filled with the background color you choose. PNG keeps transparency.",
  },
  {
    question: "Are my images uploaded?",
    answer:
      "No. Conversion runs in your browser, so your WebP files stay on your device.",
  },
];
