# AI Video Command Center — free-first update

This update keeps AI prompt writing through the existing Gemini text API, subject to the Google AI key's available quota. The browser composes a free storyboard preview locally from AI scene descriptions and the uploaded reference images. An optional paid button generates three actual AI storyboard images from those scenes and references, after an explicit confirmation.

## What changed

- Upload up to five reference images and assign each one as product, presenter, or scene.
- Optional presenter identity guidance tells Gemini to describe visible traits and keep the same person in all three scenes. A prompt cannot guarantee that a separate video-generation service reproduces a face exactly.
- AI-generated scene descriptions drive the three storyboard panels; the panels are an in-browser composition, not AI-generated images.
- The optional paid image feature uses Gemini 3.1 Flash Image at 1K and the same private Netlify API key. Google lists standard output at about US$0.067/image, so three images are about US$0.20 before input image/text charges. Prices can change; actual billing follows the Google AI account.
- Identity consistency can be improved with the presenter reference but cannot be guaranteed at 100%.
- Choose 15–60 seconds to have Gemini write a sequence of prompts in segments of up to 10 seconds. Each segment can be copied separately and includes continuity guidance. For tools that accept a reference frame, pass the previous clip's final frame into the next clip to help maintain visual continuity. The site does not directly call a video-generation provider.
- The available durations are 8, 10, 15, 20, 30, 45, and 60 seconds. For example, 15 seconds becomes a 10-second prompt followed by a 5-second prompt.

## Publish through GitHub and Netlify

1. Open the connected GitHub repository and upload/replace `index.html` at the repository root.
2. Also add `netlify/functions/generate-prompt.mjs`, keeping the folders exactly as shown. This function keeps the Gemini key on Netlify's server and must be included for the AI prompt button to work.
3. Add `netlify/functions/generate-storyboard.mjs` too. It handles the paid image-generation request on Netlify so the API key is not exposed in the page.
4. Keep `assets/storyboard-three-panel.jpg` if it is already in the repository; this update does not need to replace it.
5. Commit the changes to the branch connected to Netlify. Netlify should start a deploy automatically. Wait for the production deploy to show **Published**.
6. Reload the site, choose a duration above 10 seconds, and click **ให้ AI เขียน Prompt จากโจทย์**. Copy each clip prompt into your video tool in order. If that tool accepts a starting/reference frame, use the last frame of the prior clip for continuity.
7. For the optional paid image feature, add a product/presenter reference, then choose the paid storyboard button and confirm only if you accept the displayed estimate.

Keep the existing `GEMINI_API_KEY` Netlify environment variable and ensure Google AI billing is enabled before using paid image generation. The paid-image function stays disabled until the site owner adds `ENABLE_PAID_IMAGE_GENERATION=true` under Netlify **Site configuration → Environment variables**, then triggers a new deploy. This gives the owner a deliberate switch before paid requests are available. Do not paste the key into GitHub or into the website's HTML. Gemini text requests may use free quota where available; usage and limits depend on the Google AI account.
