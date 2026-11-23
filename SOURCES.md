# Content and asset sources

The website presents **GenPA: Image Generators as Efficient Robot Policies**. Research claims, figures, and benchmark values follow the accompanying manuscript.

| Content | Source and presentation |
| --- | --- |
| Method and architecture | GenPA method and implementation sections. The architecture image is rendered from the manuscript figure. The interactive overview illustrates the two training forwards and the action-only deployment path. |
| Author affiliations | Author-supplied arXiv manuscript. The compact view groups institutions; the expanded view preserves the six full affiliations and corresponding author superscripts. |
| Motivation illustrations | Original images and prompts from the manuscript motivation figure and appendix. The input frame comes from [ALOHA Unleashed](https://aloha-unleashed.github.io/); the goal and motion illustrations are GPT Image 2 edits, as attributed in the page. |
| Visual-target gallery | Original aligned agent and wrist images from a LIBERO milk-to-basket demonstration, with the manuscript's seven visual supervision targets. Image pixels and target encodings are preserved. |
| Project link preview | RGB, depth and segmentation are aligned panels from the [GenPA-LIBERO dataset preview](https://huggingface.co/datasets/Deduktive/GenPA-LIBERO/blob/main/preview.png). The card increases depth contrast for readability. |
| Benchmark tables | Manuscript LIBERO, LIBERO-Plus, and RoboTwin 2.0 tables, recorded in `assets/benchmark-data.json`. |
| Latency plots | Manuscript H100 totals and component measurements, recorded in `assets/latency-data.json` and `assets/latency-components.json`. GenPA (flow) includes the corresponding eight-step component measurements. |
| Visual supervision study | Manuscript supervision-ablation table, recorded in `assets/supervision-data.json`. This uses the dedicated training configuration described on the page. |
| Demonstration videos | The three original 1080p supplementary videos are available for download. The embedded 720p, 30 fps copies preserve their duration. Posters use a frame from each video. |
| Paper and citation | [GenPA on arXiv](https://arxiv.org/abs/2611.27446) and the project's [OpenReview entry](https://openreview.net/forum?id=WA0THUR3x9). |
| Resource icons | [arXiv small logomark](https://github.com/arXiv/arxiv-docs/blob/develop/source/assets/arxiv-logomark-small-ORIG-COLORS.svg), [GitHub mark from Octicons](https://github.com/primer/octicons/blob/main/icons/mark-github-16.svg) ([MIT license](assets/icons/octicons-LICENSE.txt)), and the [Hugging Face logo](https://huggingface.co/brand). |

## Data conventions

- Latency ranking uses independently measured full-policy totals. Component measurements retain their original values; their sum is not substituted for a full-policy total. Both execution modes use the same axis.
- Visual-supervision results distinguish absolute success rates from percentage-point changes relative to action-only training.
- The gallery preserves the original grayscale and color encodings. Future targets correspond to 16 retained action steps ahead.
- Illustrative motivation edits, training targets, and robot demonstrations retain their distinct roles and attributions.

## Fonts and design

[Inter](https://rsms.me/inter/) is self-hosted under the [SIL Open Font License](assets/fonts/OFL.txt). The restrained navigation and RGB-to-target interaction were informed by [Vision Banana](https://vision-banana.github.io/); its code and media are not included. The color palette follows the GenPA architecture figure.
