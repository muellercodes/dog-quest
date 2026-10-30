# Dog Quest art direction

The target is a polished, hand-drawn storybook look on the level of Cat Quest: bright, soft, cozy, clean.
Not 3D toys, not pixel art, not photoreal. Everything is still drawn in code (canvas 2D), but drawn the way
an illustrator would paint it.

## Light and colour
- One sun, from the upper left. Highlights sit on upper-left edges, shadows on lower-right sides.
- Shadow tones are the base colour darkened 18 to 28% and nudged toward violet/blue (never grey or black).
  Use `shadeTone(hex)` and `lightTone(hex)` from 05d_ink.js.
- Highlights are the base lightened 15 to 25% and nudged warm (toward yellow).
- Cast shadows on the ground are soft, purple-tinted (rgba(52,28,74,0.22) to 0.3) and fall slightly to the lower right.
- Saturated but harmonious. Greens lean yellow. Water is turquoise in the shallows, cobalt in the deep.

## Line
- Outline colour is warm plum `OUT` (#3b2235). No black lines.
- Outer silhouettes get one clean outline around the whole shape (draw the silhouette once in plum with a
  thick stroke, then paint the colours on top with no strokes). Parts that overlap must not show their own outlines.
- Outline weight varies like ink: heavier on the lower-right (shadow) side, lighter on the upper-left.
  The cheap way: draw the plum silhouette twice, the second time offset (+0.8, +1.0).
- Interior lines are thinner (about 60% of the outline), used sparingly, and taper at their ends (`taperLine`).

## Shading
- Cel shading with soft edges: base colour, then a shadow band clipped inside the shape on the lower-right,
  then a smaller highlight on the upper-left. Bands, not big smooth gradients.
- Ambient occlusion where things meet the ground: a soft dark gradient at the base.
- Glowing things (torches, magic, the Golden Ball) get an additive ('lighter') soft glow.

## Motion
- Nothing alive is ever perfectly still: idle breathing, ear and tail sway, trees and grass bending in the wind,
  banners waving, water moving.
- Animation follows the classic principles: anticipation before an action, follow-through after,
  squash and stretch on steps and landings, arcs, ease-in and ease-out, secondary motion (ears and tails lag
  behind the body on springs).

## Performance budget
- 60 fps on a phone. Heavy work (noise, blur, textures) is baked once into offscreen canvases.
- Per frame: at most a few hundred path fills for scenery in view, characters drawn live.
- No `ctx.filter` at runtime (Safari). `shadowBlur` only while baking.
- No em dashes anywhere in the page (the build refuses them).
