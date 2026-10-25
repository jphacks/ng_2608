# 端末内の写真検出に使うコンポーネント

追加機能：
- WebLLM 0.2.85（Apache-2.0）: https://github.com/mlc-ai/web-llm 。`public/demo/webllm-LICENSE.txt` を同梱。ブラウザ用Workerは `worker/local-ai-worker.mjs` から生成します。
- Qwen2.5-1.5B-Instruct（Apache-2.0）: https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct 。WebLLM用の `mlc-ai/Qwen2.5-1.5B-Instruct-q4f32_1-MLC` を利用者の操作後に取得します。文章はこのモデルの実行のために外部送信しません。
- MediaPipe Selfie Segmenter float16: https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite 。モデルは同一サイトから配信し、画像の推論は端末内で行います。
- UIはリポジトリに既存のshadcn/Base UI部品と既存CSSを活用し、スマホ用の補助コントロールを追加しています。新しい有料UIテンプレートは導入していません。

- Tesseract.js 6.0.1 / tesseract.js-core 6.1.2: Apache-2.0。https://github.com/naptha/tesseract.js
- Tesseract言語データ（jpn / eng）: https://github.com/naptha/tessdata / Apache-2.0
- MediaPipe Tasks Vision 1.1.1: Apache-2.0。https://developers.google.com/edge/mediapipe/solutions/vision/face_detector/web_js
- BlazeFace short-range float16 model: https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite

public/demo/visionには実行用アセットを同梱しています。Tesseractのライセンスファイルも同梱しています。
これらは端末内の検出に使い、画像や検出結果を外部のAPIに送る処理はありません。
