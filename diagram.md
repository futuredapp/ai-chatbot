graph TD
    subgraph Initialization
        Tutorial(Tutoriál)
        Q_Goal{Chceš řešit problém, nebo celkově zlepšit život?}
        Tutorial --> Q_Goal
    end

    Q_Goal -- řešit problém --> Problem_Branch(Problém)
    Q_Goal -- zlepšit život --> Improve_Branch(Zlepšit život)

    subgraph Problem Path - Initial Event
        Problem_Branch --> P_AskFeeling("Jak se teď cítíš? -+100")
        P_AskFeeling --> P_AskProblem("Jaký máš problém?")
        P_AskProblem --> P_AskGoal("Jaký máš cíl? Jaký máš záměr?")
        P_AskGoal --> P_Q1("Kdy v poslední době ti vadilo problém?")
        P_Q1 --> P_Q2("Jak dlouho ta událost trvala?")
        P_Q2 --> P_Q3("Jdi na začátek té události, řekni mi, až tam budeš.")
        P_Q3 --> P_Q4("Kde jsi?")
        P_Q4 --> P_Q5_Narrate("Vyprávěj událost od začátku do konce v přítomném čase.")
        P_Q5_Narrate --> P_Q_MoreUnpleasant{Je tam dál něco nepříjemného?}

        P_Q_MoreUnpleasant -- ano --> P_AskContinue("Jak událost pokračuje?")
        P_AskContinue --> P_Q_Feelings1{Měla jsi tam nějaké nepříjemné pocity?}
        P_Q_MoreUnpleasant -- ne --> P_Q_Feelings1

        P_Q_Feelings1 -- ano --> P_AskWorst("Co tam bylo pro tebe to nejhorší?")
        P_Q_Feelings1 -- ne --> P_PinkEntry("Růžový box: Přechod k závěrečnému zpracování nebo D-krokům")

        style P_AskWorst fill:#f9f,stroke:#333,stroke-width:2px

        P_AskWorst --> P_BadEventCheck{Napadá tě jiná situace, kdy v poslední době ti vadilo problém?}
        style P_BadEventCheck fill:#fef3bd,stroke:#333,stroke-width:2px

        P_BadEventCheck -- "ano jiná situace" --> P_Q1
        P_BadEventCheck -- "ne zpracovat 'nejhorší'" --> P_Q1_FirstTime("Kdy jsi 'to nejhorší' zažil/a poporvé? Kdy to bylo?")

    end

    subgraph Problem Path - First Time Event & Loop
        P_Q1_FirstTime --> P_Q2_FirstTime("Jak dlouho ta událost trvala?")
        P_Q2_FirstTime --> P_Q3_FirstTime("Jdi na začátek té události. řekni mi, až tam budeš.")
        P_Q3_FirstTime --> P_Q4_FirstTime("Kde jsi?")
        P_Q4_FirstTime --> P_Q5_Narrate_FirstTime("5. Vyprávěj událost od začátku do konce v přítomném čase.")

        P_Q5_Narrate_FirstTime --> P_Loop_CheckUnpleasant{Je tam dál něco nepříjemného?}

        P_Loop_CheckUnpleasant -- ano --> P_Loop_AskContinue("Jak událost pokračuje?")
        P_Loop_AskContinue --> P_Loop_CheckFeelings1{Měla jsi tam nějaké nepříjemné pocity?}
        P_Loop_CheckUnpleasant -- ne --> P_Loop_CheckFeelings1

        P_Loop_CheckFeelings1 -- ano --> P_Loop_AskWorst("Co tam bylo pro tebe to nejhorší?")
        style P_Loop_AskWorst fill:#fef3bd,stroke:#333,stroke-width:2px

        P_Loop_AskWorst --> P_Loop_AcceptWorst("Opakuj: Přijímám 'to nejhorší' a pak všechny ostatní zapsané negace.")
        P_Loop_AcceptWorst --> P_Loop_ReviewEventNewNegatives("Projdi událost od začátku do konce. Zapisují se JENOM nové negace.")
        P_Loop_ReviewEventNewNegatives --> P_Loop_CheckFeelings2{Měl/a jsi tam nějaké nepříjemné pocity? Emoce, nebo tělesné pocity?}

        P_Loop_CheckFeelings2 -- ano --> P_Loop_AskWorst

        P_Loop_CheckFeelings1 -- ne --> P_Loop_ReviewEventInMind("Projdi událost od začátku do konce V DUCHU")
        P_Loop_CheckFeelings2 -- ne --> P_Loop_ReviewEventInMind

        P_Loop_ReviewEventInMind --> P_Loop_CheckFeelings3{"Měl/a jsi tam nějaké nepříjemné pocity? Emoce, tělesné? Musí být 3x NE"}
        P_Loop_CheckFeelings3 -- "ano selhání 3x kontroly" --> P_Loop_AskWorst
        P_Loop_CheckFeelings3 -- "ne úspěšná 3x kontrola" --> P_FinalFeelingCheck1("Jak se teď cítíš? Od mínus 100 do plus 100")

        P_FinalFeelingCheck1 --> P_FinalCheckProblem("Jak vnímáš do budoucna Problém? Od mínus 100 do plus 100")
        P_FinalCheckProblem --> P_FinalCheckGoal("Jak vnímáš do budoucna cil? Od mínus 100 do plus 100")
        P_FinalCheckGoal --> P_FinalFeelingCheck2("Jak se teď cítíš? Od mínus 100 do plus 100")
        P_FinalFeelingCheck2 --> P_RealityCheck("Otevři oči, Co je za den?")
        P_RealityCheck --> P_FinalFeelingCheck3("Jak se teď cítíš?")
        P_FinalFeelingCheck3 --> EndP((End Problem Path))
    end

    subgraph Improve Life Path - Initial Definition
        Improve_Branch --> I_FamilyDef("Sekce definice rodiny")
        I_FamilyDef --> I_AskFeeling("Jak se teď cítíš?")
        I_AskFeeling --> I_AskGoal("Jaký máš cíl?")
        I_AskGoal --> I_ImaginePerson("Představ si osobu jaký máš pocit?")
        I_ImaginePerson --> I_Q_Negatives1("Co ti kdy vadilo/vadí na ní/něm? Co ještě?")
        I_Q_Negatives1 --> I_Q_Negatives2("Co ji/jemu vadilo/vadí na tobě? Co ještě?")
        I_Q_Negatives2 --> I_Q_Negatives3("Co ti vadilo/vadí na vašem vztahu? Co ještě?")
        I_Q_Negatives3 --> I_Q_Negatives4("Co ti vadilo/vadí na jeho/jejím vztahu k někomu? Co ještě?")
        I_Q_Negatives4 --> I_Q_Quotes("Co říkal/a nebo říká, co ti vadilo/vadí? Zapsat přesně Co ještě?")
        I_Q_Quotes --> I_Q_Resemblance("Napadlo tě někdy, že jsi po ní/něm, strach že budeš/nechceš být po ní/něm...? Co ještě?")
        I_Q_Resemblance --> I_Q_Losses("Ztráty v tomto vztahu? Co ještě?")
        I_Q_Losses --> I_ExampleStatement("Např.: Nemá mě ráda u M+T a vychovatelů")
        I_ExampleStatement --> I_Q_Alive{Žije ještě osoba?}

        I_Q_Alive -- ne --> I_AskDeath("Jak ses dozvěděla, že zemřela?")
        I_AskDeath --> I_ProcessNegativesStart("Začni zpracovávat negace")

        I_Q_Alive -- ano --> I_ProcessNegativesStart
    end

    subgraph Improve Life Path - Processing Negatives
        I_ProcessNegativesStart --> I_AcceptNegation("Přijímám, že negace. Opakuji VÝROK S tou osobou Pro každou negaci/výrok")
        I_AcceptNegation --> I_ImagineNegationLoop("Představ si osobu jak negaci. Pocit? - 0 + nepříjemný-žádný-příjemný Pro každou negaci")

        I_ImagineNegationLoop --> I_CheckAllNegatives{Všechny negace zpracovány s dobrým/neutrálním pocitem?}

        I_CheckAllNegatives -- ano --> I_AllGood("VŠECHNY negace jsou neutrální nebo dobré")
        I_AllGood --> D_Start("Start Reconciliation D-Steps")

        I_CheckAllNegatives -- "ne některé špatné" --> I_IdentifyBadNegative("Identifikuj negaci se špatným pocitem např. KOUŘÍ")
        I_IdentifyBadNegative --> I_EvalBadNegative("Představ si osobu jak špatná negace např. KOUŘÍ. Pocit? - 0 +")
        I_EvalBadNegative --> I_CheckFeelingBad{Pocit?}

        I_CheckFeelingBad -- "dobrý/neutrální" --> I_MarkResolved("Označ negaci jako vyřešenou")
        I_MarkResolved --> I_ImagineNegationLoop

        I_CheckFeelingBad -- špatný --> I_DeepDiveNegative("Zpracování špatné negace: Co ti na tom vadí/vadilo? Co by se mohlo stát? Co říká? Proč ti to vadí?")
        I_DeepDiveNegative --> I_AskWhyItBothers("Co ti na tom vadí?")
        I_AskWhyItBothers --> I_ImagineSelf("Představ si, že děláš totéž, např. SMRDÍŠ TAKY. Pocit?")
        I_ImagineSelf --> I_AcceptSelf("Přijímám, že dělám totéž, např. SMRDÍM TAKY.")
        I_AcceptSelf --> I_AskWhySelf("Co ti na tom vadí na sobě?")
        I_AskWhySelf --> I_ImagineSelfAgain("Představ si, že děláš totéž. Pocit?")
        I_ImagineSelfAgain --> I_CheckFeelingSelf{Pocit? - 0 +}

        I_CheckFeelingSelf -- špatný --> I_AskWhySelf
        I_CheckFeelingSelf -- "dobrý/neutrální" --> I_LoopBackGreen("Vrať se k hodnocení původní negace u druhé osoby")
        I_LoopBackGreen --> I_EvalBadNegative
    end

    subgraph Reconciliation D-Steps Improve Life Path
        P_PinkEntry --> D_Start

        D_Start --> D_ImaginePersonCheck("Představ si osobu... jaký máš pocit? Od mínus 100 do plus 100")
        D_ImaginePersonCheck -- 100 --> D_FinalChecks_Improve("Přeskočit na závěrečné kontroly")

        D_ImaginePersonCheck -- 0-99 --> D_AskImprove("Co by se muselo stát aby to bylo plus 100?")
        D_AskImprove --> D1("Všechno si s ní vyříkej.")
        D1 --> D1_Check{Pocit při vyříkávání?}
        D1_Check -- Nepříjemný --> D1_Accept("Přijímám, že ji/mu nemám co říct")
        D1_Accept --> D2("D2. Opakuj: Omlouvám se za všechno.")
        D1_Check -- "Žádný/příjemný" --> D2

        D2 --> D2_Check{Omlouváš se za všechno?}
        D2_Check -- ano --> D3("D3. Opakuj: Prosím odpust mi všechno.")
        D2_Check -- ne --> D2_AskWhy("Proč se neomlouváš?")
        D2_AskWhy --> D3

        D3 --> D3_Check{Odpuští ti všechno?}
        D3_Check -- ano --> D4("D4. Opakuj: Odpouštím ti všechno.")
        D3_Check -- ne --> D3_AskWhy("Co a proč ti neodpouští?")
        D3_AskWhy --> D4

        D4 --> D4_Check{Odpouštíš jí/mu všechno?}
        D4_Check -- ano --> D_Continue("Pokračuj dalšími D-kroky až po D13 - Děkování")
        D4_Check -- ne --> D4_AskWhy("Co a proč mu/jí neodpouštíš?")
        D4_AskWhy --> D_Continue

        D_Continue --> D_FinalChecks_Improve

        D_FinalChecks_Improve --> I_FinalCheckRelation("Představ si vztah s osobou do budoucna - jaký máš pocit? Od mínus 100 do plus 100")
        I_FinalCheckRelation --> I_FinalFeeling1("Jak se teď cítíš? Od mínus 100 do plus 100")
        I_FinalFeeling1 --> I_RealityCheck("Otevři oči, co je za den? Jaká je to barva?")
        I_RealityCheck --> I_FinalFeeling2("Jak se teď cítíš?")
        I_FinalFeeling2 --> EndI((End Improve Path))
    end