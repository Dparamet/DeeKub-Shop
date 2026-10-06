export const themeKey = "deekub.theme.v1";

// Apply the saved preference before paint; only these two values reach the DOM.
export const themeScript = `(function(){var t;try{t=localStorage.getItem("${themeKey}")}catch(e){}if(t!=="light"&&t!=="dark")t=window.matchMedia("(prefers-color-scheme: light)").matches?"light":"dark";document.documentElement.dataset.theme=t})()`;
