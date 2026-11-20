# Content and asset sources

The website presents **GenPA: Image Generators as Efficient Robot Policies**. Research claims, figures, and benchmark values follow the accompanying manuscript.

| Content | Source and presentation |
| --- | --- |
| Method and architecture | GenPA method and implementation sections. The architecture image is rendered from the manuscript figure. The interactive overview illustrates the two training forwards and the action-only deployment path. |
| Author affiliations | Author-supplied arXiv manuscript. The compact view groups institutions; the expanded view preserves the six full affiliations and corresponding author superscripts. |
| Motivation illustrations | Original images and prompts from the manuscript motivation figure and appendix. The input frame comes from [ALOHA Unleashed](https://aloha-unleashed.github.io/); the goal and motion illustrations are GPT Image 2 edits, as attributed in the page. |
| Visual-target gallery | Original aligned agent and wrist images from a LIBERO milk-to-basket demonstration, with the manuscript's seven visual supervision targets. Image pixels and target encodings are preserved. |
| Benchmark tables | Manuscript LIBERO, LIBERO-Plus, and RoboTwin 2.0 tables, recorded in `assets/benchmark-data.json`. |
| Latency plots | Manuscript H100 totals and component measurements, recorded in `assets/latency-data.json` and `assets/latency-components.json`. GenPA (flow) includes the corresponding eight-step component measurements. |
| Visual supervision study | Manuscript supervision-ablation table, recorded in `assets/supervision-data.json`. This uses the dedicated training configuration described on the page. |
| Demonstration videos | The three original supplementary videos, presented at their original playback speed. Posters use a frame from each video. |
| Paper and citation | The author-approved bundled manuscript and the project's [OpenReview entry](https://openreview.net/forum?id=WA0THUR3x9). |

## Data conventions

- Latency ranking uses independently measured full-policy totals. Component measurements retain their original values; their sum is not substituted for a full-policy total. Both execution modes use the same axis.
- Visual-supervision results distinguish absolute success rates from percentage-point changes relative to action-only training.
- The gallery preserves the original grayscale and color encodings. Future targets correspond to 16 retained action steps ahead.
- Illustrative motivation edits, training targets, and robot demonstrations retain their distinct roles and attributions.

## Fonts and design

[Inter](https://rsms.me/inter/) is self-hosted under the [SIL Open Font License](assets/fonts/OFL.txt). The restrained navigation and RGB-to-target interaction were informed by [Vision Banana](https://vision-banana.github.io/); its code and media are not included. The color palette follows the GenPA architecture figure.

Original asset hashes are recorded in `asset-manifest.json`.
