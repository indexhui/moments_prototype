# Social prize presentation artwork

Source: [社群活動演出, Figma 12946:16774](https://www.figma.com/design/9ased7HFhhFpvVNl3WPrdK?node-id=12946-16774).

Original image assets downloaded from the design context, without redrawing:

- `friends-sticker.png`: 青蛙小貝狗和狗貼紙, node `12914:16635`.
- `frog-sticker.png`: 青蛙貼紙, node `12914:16634`.
- `naotaro-sticker.png`: 直太郎貼紙, node `12914:16636`.

The presentation reuses the exact postcard exports under `/images/exhibition/ending/` and the original ticket and dot background under `/images/ticket/`.

Route: `/game/marketing/social/prize-reveal`, within the existing `GameFrame` stage. The right sidebar opens the route and can replay the full sequence or just the prizes. The Figma node has no motion tracks; staggered postcard and sticker entrances are authored for the requested recording presentation. The final composition retains the 786 × 1704 design coordinates. All artwork is decoded before playback, and replay cancels any previous sequence.

The ticket uses the original manual pointer gesture: drag the stub to the right, release early to spring back, or pull far/fast enough to tear. It waits for input on every replay. When the tear begins, the glow, sparkles, and a single scale-up-to-106.5%-then-back pop start together. The pop stays on one continuous timeline as tearing completes, then leads automatically into the overlapping prize entrance. The presentation always shows A prize through a local callback; it does not call the exhibition raffle or write progress, receipts, or stock.
