# B2B Calculator

Prosty kalkulator front-end, który pomaga przedsiębiorcom B2B w Polsce ocenić, która forma opodatkowania (skala podatkowa, podatek liniowy lub ryczałt) jest dla nich najbardziej korzystna. Interfejs oraz układ bazują na stylistyce projektu `invoice-generator-v2`, dzięki czemu całość wygląda spójnie w zestawie narzędzi.

## Funkcje

- Podajesz roczne przychody, koszty oraz wysokość miesięcznych składek społecznych ZUS.
- Kalkulator automatycznie szacuje podatek i składkę zdrowotną dla każdej formy opodatkowania na podstawie uproszczonych reguł (aktualizacja 2024).
- Natychmiastowa rekomendacja z informacją, o ile dana forma przewyższa kolejną opcję.
- Karty porównawcze pokazujące podatek roczny, składkę zdrowotną oraz efektywne obciążenie w %.
- Przyciski typu „Wypełnij przykładowo” pozwalają zobaczyć działanie kalkulatora bez ręcznego wpisywania danych.

## Jak uruchomić

To aplikacja statyczna – wystarczy otworzyć plik `index.html` w przeglądarce (dwuklik lub poprzez prosty serwer HTTP, np. `npx http-server`). Nie są wymagane dodatkowe zależności ani proces build.

## Założenia obliczeń

- Skala podatkowa: stawki 12% / 32%, kwota wolna domyślnie 30 000 zł (można ją zmienić w formularzu). Składka zdrowotna = 9% dochodu, minimum 381,78 zł miesięcznie.
- Podatek liniowy: stała stawka 19%, składka zdrowotna 4,9% dochodu, minimum 381,78 zł miesięcznie.
- Ryczałt: składka zdrowotna zależna od rocznego przychodu (419,46 / 699,11 / 1 258,39 zł miesięcznie). Podatek = (przychód – składki społeczne) × zadana stawka.
- Składki społeczne ZUS wprowadzasz ręcznie – w modelu są odejmowane od przychodu przed wyliczeniem podatku (tam, gdzie to ma zastosowanie).
- Wyniki mają charakter orientacyjny. W rzeczywistym rozliczeniu weź pod uwagę ulgi, amortyzację, wspólne rozliczenie z małżonkiem itd.

## Struktura

```
├── app.js        # Logika kalkulatora i aktualizacja UI
├── index.html    # Struktura strony i komponenty
├── styles.css    # Styl bazujący na invoice-generator-v2
└── README.md
```

## Dalsze kroki

- Dodanie testów jednostkowych dla funkcji obliczeniowych, jeśli kalkulator będzie rozwijany.
- Integracja z backendem lub możliwością zapisu scenariuszy, gdyby narzędzie miało być częścią większego serwisu.
