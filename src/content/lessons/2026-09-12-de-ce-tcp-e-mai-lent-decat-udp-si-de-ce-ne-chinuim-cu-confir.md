---
title: "De ce TCP e mai lent decât UDP — și de ce ne chinuim cu confirmări"
date: "2026-09-12"
category: "tech"
---
Pe internet, datele tale se deplasează în pachete mici, ca niște mesaje postale. Dar spre deosebire de poștă, nu orice mesaj ajunge garantat. Aici intră în joc o alegere fundamentală: vrei viteză sau siguranță?

TCP (Transmission Control Protocol) și UDP (User Datagram Protocol) sunt doi "vehicule" complet diferiți pentru a trimite aceste pachete.

Imagine-ți că trimiți 1000 de cărți unui prieten. Cu TCP, funcționează exact ca o trimitere asigurată: tu trimiți o carte, prietenul tău semnează că a primit-o (ACK — acknowledgment). Dacă semnătura nu vine în timp, tu retrimiti cartea. La final, știi sigur că toate 1000 de cărți au ajuns, în ordinea exactă în care le-ai trimis.

Cu UDP? Arunci toate 1000 de cărți în mașina poștei și speri la bine. Dacă 50 cărți se pierd pe drum, asta nu e treaba ta. Sunt mai repede acolo — nu stai să primești confirmări — dar nu ai garanție.

De ce TCP e mai lent?

1. **Confirmări (Handshake).** Înainte de a trimite orice data, TCP face o "apă mână" cu serverul — o serie de mesaje pentru a verifica că ambele părți sunt gata. UDP nu face asta. Doar trimite.

2. **Retransmisii.** Dacă un pachet se pierde, TCP îl retrimite. UDP nu. Asta înseamnă că TCP trebuie să aștepte, să verifice, să-și facă treaba de "frizer" — verific, verific din nou.

3. **Ordinea garantată.** TCP ține evidența fiecărui pachet trimis, cu un număr de secvență. Serverul le reasamblează în ordinea corectă. UDP nu — dacă pachetele vin în dezordine, ghinion, asta e ordinea în care le folosești.

Unde sunt folosite?

**TCP** pentru:
- Email (SMTP, POP3) — nu vrei să pierzi mesaje
- Browser-ul tău (HTTP/HTTPS) — vrei paginile complete și în ordinea corectă
- Transferul de fișiere (FTP) — fiecare byte contează

**UDP** pentru:
- Video streaming live (YouTube, Netflix) — dacă pierzi 1-2 cadre din 30 pe secundă, nu e drama
- Gaming online — latența mică e mai importantă decât fiecare pachet; vrei reacție instantanee, nu o acuratețe perfectă
- Telefonia VoIP — vorbești acum, nu după 10 secunde
- DNS — "Unde e google.com?" — îți trebuie răspunsul repede, nu perfect

**Costul fiabilității:** TCP poate fi de 10-100 de ori mai lent decât UDP pentru același volum de date, din cauza tuturor acestor "apă mână" și confirmări. Dar pentru email sau download-uri, asta nu contează — vrei corectitudine.

Cruzismul: Nu e că TCP e prost și UDP e bun. E că ai nevoie de *instrumentul potrivit*. Un chitarist nu folosește ciocan dacă are un ciocan în mână — și invers.