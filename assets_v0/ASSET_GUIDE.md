# Última Linha — Asset Guide

Todos os ficheiros foram **redesenhados como vetor** (SVG) a partir do logo original (`source/ultimalinha_logo_original.png`) — sem upscaling de raster. Geometria, proporções e espaçamentos do original preservados; sem gradientes, glow ou sombras. Os PNG são renderizados directamente do vector, com anti-aliasing real.

## Cores usadas nos logos (medidas do ficheiro original)
| Elemento | Hex |
|---|---|
| "UL" (dark) | #D9D9D9 |
| `</>` e "LINHA" | #CAA16D |
| "ÚLTIMA" (dark) | #FFFFFF |
| Fundo UL Black | #1E1E1E |
| Fundo OG (Deep Black) | #111111 |

**Atenção:** o dourado do logo original mede ≈ #CAA16D; a paleta do brief diz UL Gold #D89B46. Foi respeitado o logo (fonte de verdade). Para mudar para #D89B46, editar `GOLD` em `source/trace/ul_build.py` (1 linha) e re-executar:
`python3 -I ul_build.py geometry.json ultimalinha_logo_original.png <pasta_saida>`.

## Inventário
| Ficheiro | Dimensões | Fundo previsto | Uso |
|---|---|---|---|
| `logo/ul-logo-primary-dark.svg` / `-1600.png` | viewBox 745×419 (PNG 1600×900) | **escuro** (#1E1E1E/#111) | Logo principal em fundos escuros (Landing, Console) |
| `logo/ul-logo-primary-light.svg` / `-1600.png` | idem | **claro** (branco/#F5F3EF) | Logo principal em fundos claros (Client, docs) |
| `logo/ul-logo-primary-white.svg` / `-1600.png` | idem | escuro/foto | Monocromático branco |
| `logo/ul-logo-primary-black.svg` / `-1600.png` | idem | claro | Monocromático preto (#1E1E1E) |
| `logo/ul-logo-horizontal-dark.svg` / `-2000.png` | viewBox 1436×249 (PNG 2000×347) | escuro | Header/sidebar largo |
| `logo/ul-logo-horizontal-light.svg` / `-2000.png` | idem | claro | Header em fundo claro |
| `logo/ul-mark-dark.svg` / `-1400.png` | ≈725×230 | escuro | Símbolo "UL </>" sem wordmark |
| `logo/ul-mark-light.svg` / `-1400.png` | idem | claro | idem, fundo claro |
| `icons/ul-app-icon.svg` | 1024×1024, cantos 230 | — | Ícone web/PWA (cantos arredondados) |
| `icons/ul-app-icon-{1024,512,192,180}.png` | quadrado, opaco, sem cantos | — | Lojas/iOS/PWA (o SO aplica a máscara) |
| `favicon/favicon.svg` | 64×64 | — | `<link rel="icon" type="image/svg+xml">` |
| `favicon/favicon.ico` | 16/32/48 | — | Fallback |
| `favicon/favicon-{16,32,48}.png`, `apple-touch-icon.png` (180) | — | — | PNGs de favicon |
| `social/ul-og-1200x630.png` / `.svg` | 1200×630 | #111111 | Open Graph / Twitter card |

Os PNG dos logos têm **fundo transparente** — usar a variante que contrasta com o fundo.

## Regras de uso
- Não esticar, rodar, recolorir fora das variantes, nem adicionar sombra/glow/gradiente.
- Favicon e tamanhos pequenos usam apenas "UL" (o `</>` perde-se abaixo de ~32 px). O ícone de app usa "UL </>".
- Variante horizontal: peças originais, sem alteração, apenas reposicionadas lado a lado.
- Área de segurança: ≥ 40 unidades (margem já incluída nos ficheiros primary/horizontal).

## Fora deste conjunto (de propósito)
Backgrounds, auth, estados vazios/erro e primitivas de cliente da entrega anterior foram retirados (qualidade insuficiente). Podem ser reconstruídos sobre este vector quando forem necessários.
