Hey Mads og Lars,

Har haft super travlt med at bygge min egen platform færdig og har derfor endnu ikke haft tid til udvikling på board AI. Dog har jeg den seneste tid eksperimenteret en del med udvikling af generative agenter til eget formål, og jeg ser derfor nye og større muligheder for projektet. I går udgav det kinesiske research AI lab DeepSeek en ny SoTA model der rivaliserer OpenAI O1 i perfomance, men er 10x billigere og open source. Vi kan selv hoste modellen på kraftig GPU og dermed også sikre datasikkerhed.

Har skrevet et kort braindump om mine tanker om hvordan jeg forestiller mig BoardAI's arkitektur, data og UX kan udfoldes - se vedhæftede og del gerne jeres takes

Jeg er (stadig) meget tæt på at være i hus med min egen platform - væsentligt tættere end sidst. Har derfor mulighed for at bygge en mere imponerende beta som I kan gå i byen med i slut februar/start marts, om det stadig har interesse.

Bedste hilsner,
Gustav


 One attachment  •  Scanned by Gmail
Mads Lunøe
	
Jan 21, 2025, 10:23 PM
	
to me, Lars
Hej Gustav,

Godt at høre fra dig og godt at du er kommet langt med din platform - den må du huske at prioritere. 

Det lyder spændende med DeepSeek modellen - er det rigtigt forstået at hvis vi hoster den selv kan DeepSeek (og andre) slet ikke tilgå den? Det er jo væsentligt ift. både brugernes data og det ipr vi selv bygger op omkring modellen. Og selvfølgelig genialt at prisen er lav. 

Jeg tænker at det nok kan være værd at overveje om man skal bygge oven på forskellige platforme - så man både bygger på DeepSeek modellen men måske også med RAG/prompts på platforme som fx er super stærke til analyse af regnskaber - det kan give mening frem for at vi skal forsøge at konkurrere med de bedste inden for finansiel analyse. Kan du se for dig at man kan bygge på flere forskellige niveauer så man har agenter via DeepSeek og så RAG eller rent prompt på eksisterende LLM for andre elementer?

Dog er der lige en overvejelse i hvordan vi skal bygge en demo med ganske få aktive features - måske skal den bygges endnu mere simpelt så vi kan lave den let og hurtigt og så få noget ud til nogle test brugere. Det kan vi lige tale om. 

UI er helt i tråd med det jeg også havde tænkt - så noget lidt tilsvarende hos HyperWrite (bare ret uoverskueligt hos dem). Ved ikke om der er brug for canvas feltet - de brugere vi har med at gøre er næppe særligt interesserede i det. 

Vidensbank delen er spot on - det er præcis de features som skal være med. 

Techstack har jeg ikke nok indsigt i til at kunne vurdere - men har møde med en som har en phd i ML i morgen - ham kan vi helt sikkert trække på hen ad vejen - ham burde du egentlig møde - kunne være godt til dit netværk - taler med ham om det. 

Har lavet et lille mood board som prøver at fange de features (på alle niveauer) som vi skal have fanget i systemet. Der ligger en masse arbejde i den som hedder Missing Information da vi her skal igennem alt det som man som bestyrelsesmedlem bør kigge efter dvs. alt fra finansiel analyse til diversity osv. Din feature om at scrape for al information om selskabet er en god ide - den har jeg ikke med.  

image.png



Det er spændende hvis du kan kobles på projektet når du er færdig med din egen use case, men skal vi ikke lige tale om hvorvidt det giver mening for dig at bruge tid på - hvis du har en virksomhed du skal passe skal det være din prioritet. Måske vi kan tage en snak i næste uge?

bh
Mads
-- 
Med venlig hilsen/Yours Sincerely
Mads Lunøe
(+4540129817)
Gustav Welinder <gwelinder@gmail.com>
	
Jan 22, 2025, 4:21 PM
	
to Mads, Lars

Hej Mads,

Tak for dit input – det er inspirerende at høre dine tanker, og jeg synes, du rammer mange spændende vinkler.

DeepSeek-modellen: Ja, hvis vi hoster den selv, har vi fuld kontrol, og hverken DeepSeek eller andre kan få adgang til modellen eller brugerdata. Det er helt klart en stor fordel, især i forhold til datasikkerhed og compliance.

I forhold til RAG og finansielle rapporter: Jeg tror, at RAG er et stærkt værktøj til mange områder af BoardAI, men når det gælder præcise finansielle analyser, ser jeg behov for at kombinere det med en mere traditionel database som modellen kan benytte på tværs af analyser. Ved dynamisk at definere et skema, der matcher virksomhedens specifikke kontekst, kan vi sikre præcision og samtidig muliggøre, at modellen kan fact-checke under generering af rapporter. Det vil give brugeren en langt mere pålidelig oplevelse og åbner op for dybdegående analyser uden kompromis på nøjagtighed.

Flowet kunne fx se sådan ud:
1. Brugeren uploader finansielle dokumenter (.PDF eller .xlsx).
2. Dokumenterne transformeres til billeder, embeddings og markdown, før de sendes til modellen, som genererer struktureret output. (her benytter vi eksisterende AI extract services ala unstructured, kan finpudses/tunes med egne metoder senere)
3. R1/O1 genererer dernæst et passende skema til databasen og gemmer al relevant finansiel information her.


Fremover når modellen skal analysere finansiel information, kan den blot spørge databasen. Det gør det også lettere at løse punktet omkring calculation mistakes, da vi her kan få AI til at validere tal programmatisk. Vi kan tappe ind i eksisterende produkter ala https://supabase.com/features/ai-assistant her.


Det giver os et robust fundament til at levere værdi direkte fra første analyse.


Ift ekstern data kan vi bruge den nye extract feature fra firecrawl til let at levere POC: https://www.firecrawl.dev/extract

Jeg er helt med på at mødes – det er et virkelig spændende projekt, og jeg vil gerne prioritere det, selvom jeg har travlt. Jeg er dog i Marokko næste uge, så lad os sigte efter ugen efter: mandag d. 3. februar kl. 12 på Soho, eller tirsdag d. 4. februar kl. 13? Hvis din ML-PhD-kontakt er interesseret, synes jeg, det kunne være oplagt, at han også deltager – jeg vil gerne høre hans perspektiv.

Lad mig vide, hvad der passer dig bedst.

Bedste hilsner,
Gustav