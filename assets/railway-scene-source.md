# Railway scene provenance

Created on 8 October 2026 with the built-in image generation tool for this portfolio's simulated object detection demonstration. This is an original generated image, not an Infrabel photograph or model output.

- Final asset: `railway-scene.webp`
- Full framing: 1536 × 1024 (3:2), WebP quality 88, 278,590 bytes.
- The source PNG remains in the built-in generation output directory. No existing photograph was edited or replaced.
- Labels and confidence scores in the website are illustrative simulation values, not measured detections.

## Generation prompt

Use case: photorealistic-natural
Asset type: interactive object-detection image in a personal data-science portfolio.
Primary request: create an original realistic photograph of a European railway yard containing four clearly visible objects: one person in safety clothing, one STOP sign, one passenger train, and foreground railway rails.
Scene/backdrop: tidy Belgian-style railway maintenance yard with concrete walkway at the left, gravel rail beds, overhead electrical lines and distant unobtrusive industrial buildings.
Subject: one adult railway worker fully visible head to boots, wearing a high-visibility yellow vest and hard hat, standing safely on the left concrete walkway; a clearly visible red octagonal STOP sign on a pole just right of the worker; a stationary unbranded silver and charcoal passenger train with complete visible front at the right middle ground; two unobstructed railway tracks crossing the lower foreground towards the train.
Style/medium: photorealistic editorial photography, natural believable railway textures and perspective, sharp subject details.
Composition/framing: wide landscape 3:2 photograph viewed from normal standing height with moderate wide-angle lens. Person occupies x=12–25 percent and y=35–80 percent; STOP sign occupies x=34–44 percent and y=28–65 percent; train occupies x=56–94 percent and y=24–70 percent; prominent rails fill lower right foreground. All four objects remain completely within frame and are separated clearly for tapping in a small phone image. The person and sign must not overlap the train. No dramatic depth of field; all objects recognizable.
Lighting/mood: soft bright overcast daylight, quiet professional realism.
Color palette: restrained neutral grey ballast, silver train and concrete, yellow safety vest and red STOP sign are the only prominent colour accents.
Text (verbatim): "STOP" on the sign only.
Constraints: one person only; no operator logos or branding; no overlays, detection boxes, interface graphics, watermark, captions or other readable text. Keep photo complete and usable as an image with later interactive object detection overlays.

## Manual image annotations

These normalized rectangles were estimated from visual inspection of the finished image, with origin at the upper-left. Preserve the whole image and its 3:2 aspect ratio; do not crop it. The stop-sign rectangle covers the sign face, not the pole. The rail rectangle covers a representative foreground track region.

| Object | x | y | width | height | Illustrative confidence |
| --- | --- | --- | --- | --- | --- |
| Person | 0.100 | 0.244 | 0.121 | 0.583 | 98.2% |
| Stop sign | 0.315 | 0.242 | 0.104 | 0.161 | 99.3% |
| Train | 0.371 | 0.150 | 0.557 | 0.423 | 97.4% |
| Rail | 0.464 | 0.633 | 0.536 | 0.367 | 96.2% |

Use larger independent touch targets or object-selection buttons; keep these visual rectangles accurate to the photograph. These bounding rectangles can naturally overlap because the stop sign stands in front of the far train carriage.

