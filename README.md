# B2B Calculator

Prosty kalkulator front-end, ktory pomaga przedsiebiorcom B2B w Polsce ocenic, ktora forma opodatkowania (skala podatkowa, podatek liniowy lub ryczalt) jest dla nich najbardziej korzystna. Interfejs oraz uklad bazuja na stylistyce projektu `invoice-generator-v2`, dzieki czemu calosc wyglada spojnie w zestawie narzedzi.

## Funkcje

- Podajesz roczne przychody, koszty oraz wysokosc miesiecznych skladek spolecznych ZUS.
- Kalkulator automatycznie szacuje podatek i skladke zdrowotna dla kazdej formy opodatkowania na podstawie uproszczonych regul (aktualizacja 2024).
- Natychmiastowa rekomendacja z informacja, o ile dana forma przewyzsza kolejna opcje.
- Karty porownawcze pokazuja podatek roczny, skladke zdrowotna oraz efektywne obciazenie w %.
- Przyciski typu "Wypelnij przykladowo" pozwalaja zobaczyc dzialanie kalkulatora bez recznego wpisywania danych.
- Selektor ulg ZUS (Ulga na start, Preferencyjny ZUS, Maly ZUS Plus lub wlasna kwota) automatycznie podmienia skladki spoleczne.

## Jak uruchomic

To aplikacja statyczna - wystarczy otworzyc plik `index.html` w przegladarce (dwuklik lub poprzez prosty serwer HTTP, np. `npx http-server`). Nie sa wymagane dodatkowe zaleznosci ani proces build.

## Zalozenia obliczen

- Skala podatkowa: stawki 12% / 32%, kwota wolna domyslnie 30 000 zl (mozna ja zmienic w formularzu). Skladka zdrowotna = 9% dochodu, minimum 381,78 zl miesiecznie.
- Podatek liniowy: stala stawka 19%, skladka zdrowotna 4,9% dochodu, minimum 381,78 zl miesiecznie.
- Ryczalt: skladka zdrowotna zalezna od rocznego przychodu (419,46 / 699,11 / 1 258,39 zl miesiecznie). Podatek = (przychod - skladki spoleczne) x zadana stawka.
- Skladki spoleczne ZUS wprowadzasz recznie - w modelu sa odejmowane od przychodu przed wyliczeniem podatku (tam, gdzie to ma zastosowanie).
- Profile ulg przyjmuja uproszczone wartosci: Ulga na start = 0 zl/mc, Preferencyjny = 400 zl/mc, Maly ZUS Plus = 1000 zl/mc. Wybierz "Wlasna kwota", aby wpisac inna wartosc lub odwzorowac czesciowy rok.
- Wyniki maja charakter orientacyjny. W rzeczywistym rozliczeniu wez pod uwage ulgi, amortyzacje, wspolne rozliczenie z malzonkiem itd.

## Struktura

```
├── app.js        # Logika kalkulatora i aktualizacja UI
├── index.html    # Struktura strony i komponenty
├── styles.css    # Styl bazujacy na invoice-generator-v2
└── README.md
```

## Dalsze kroki

- Dodanie testow jednostkowych dla funkcji obliczeniowych, jesli kalkulator bedzie rozwijany.
- Integracja z backendem lub mozliwoscia zapisu scenariuszy, gdyby narzedzie mialo byc czescia wiekszego serwisu.
