


kontekst er altafgørende for at lave en god og præcis assistent. 

for at opnå det laver vi en krypteret virksomhedsbank for brugeren. 

jo mere vi kan få AI til at udfylde denne, jo bedre en oplevelse får brugeren.

i går blev ny kinesisk SoTA model deepseek r1 reason udgivet (https://api-docs.deepseek.com/news/news250120. den rivaliserer openAI o1 performance men er 10x billigere i tokens = boardAI bliver økonomisk feasable business case. derudover er den open source, så vi kan selv hoste fra kraftig GPU (egen eller lejet) og dermed kunne give fuld brugeren ejerskab over deres AI historik

# backend og onboarding

-  traditionel database (supabase?) hvor alt data fra brugerens dokumenter samles i gpt-strukturet format 
	- generativt schema per bruger og virksomhed, determineres af r1 under ny virksomhed onboarding og tilpasses som kontekst 
- vector db (?) til at opsamle og søge i embeddings der automatisk genereres for hvert upload
- rå dokumenter med genereret metadata
- hiv al data vi kan om virksomheden fra cvr+virk(https://datacvr.virk.dk/artikel/system-til-system-adgang-til-cvr-data) og andre off myndigheder + scraping + 3. parts data (socials, trafik, ads)
## analysebank 

ui (tilpasset fra https://v0.dev/)
![[Pasted image 20250121181114.png]]
- alle historiske analyser samt forskellige (genererede?) konkrette analyseforeslag til virksomheden
- ny analyse = chat med virksomhedsassisten 
	- system prompt opbygges med relevant kontekst om virksomheden og brugerens forespørgsel
	- AI har adgang til *predefinerede*+*generede tools* som den kalder efter behov
		- predefinerede tools kan være "opret ny viden i vidensbank", "processer dokument", "læg en plan"
		- generede tools  https://x.com/airesearch12/status/1881088515703988508 - AI får selv lov at vælge hvad det bedste tool er til at løse opgaven, og skriver et program der viser et UX tilpasset til analysen
- dokumentanalyser demonstreres for brugeren fra originaldokumentet og præsenteret i canvas/v0 agtigt vindue hvor vi streamer ai'ens arbejde til brugeren ved siden af chaten så de kan følge med i hvad der foretages
![[Pasted image 20250121181246.png]]



- dokumenter analyseres i 3 formatter af AI: 
1. originalt dokument (pptx, docx, pdf)
2. billeder af hver side
3. markdown fil konverteret m https://github.com/microsoft/markitdown/ (-ocr) eller https://unstructured.io/ (+ocr)
- klogere model tager fuld kontekst og strukturer relevant database
## vidensbank
 
- under analysearbejdet + i samtaler med brugeren, kan AI generere og tilføje generel viden. efter endt dokumentanalyse kan vi sende fuld resultat til r1 og få den til at a) tjekke/rette fejl i outputs, b) tilføje ny/ændre viden om firmaet til intern vidensbank - inspiration: ![[Pasted image 20250121180327.png]]
- hver gang der tilføjes ny viden, skal brugeren gøres opmærksom på det, samt have mulighed for at redigere eller afvise
![[Pasted image 20250121180425.png]]
- brugeren kan selv tilgå, tilføje, redigere og fjerne viden. AI kan kun  gøre disse efter tilladelse fra brugeren
 ![[Pasted image 20250121180447.png]]
- vidensbanken er en central del af virksomhedsbanken's og løser UX udfordring med at få brugeren til at forklare. 

## foreslået tech stack:

- nextjs15 
- supabase?
- vercel ai sdk m egen backend eller enterprise azure/aws?
- pinecone vector db? lokal?
