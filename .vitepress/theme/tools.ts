type TranslateResponse200 = {
  translated_text: string;
  source_lang: string;
  target_lang: string;
  chunks: number;
}
type TranslateResponse400 = {
  error: string;
  supported_languages: "zh" | "en" | "ja" | "ru" | "fr" | "lzh" | "pl" | "sv";
}
type TranslateResponse405 = {
  error: string;
}
type TranslateResponse5xx = {
  error: string;
  details: string;
}


async function translate2(text: string, targetLanguage: string): Promise<string> {
  const response = await fetch('https://translator-23xr.pages.dev/api/translator', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        text: text,
        source_lang: 'auto',
        target_lang: targetLanguage,
    })
  });
  let data = await response.json();
  if (!response.ok) {
    if (response.status === 400) {
      let data_: TranslateResponse400 = data
      throw new Error(data_.error + ', Supported Languages: ' + data_.supported_languages);
    } else if (response.status === 405) {
      let data_: TranslateResponse405 = data
      throw new Error(data_.error);
    } else if (response.status >= 500 && response.status < 600) {
      let data_: TranslateResponse5xx = data
      throw new Error(data_.error + ': ' + data_.details);
    } else {
      throw new Error(`HTTP ${response.status}`)
    }
  }
  let data_: TranslateResponse200 = data
  
  return data_.translated_text;
}

export {
  translate2
}