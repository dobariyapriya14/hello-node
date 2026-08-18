import i18n from "i18n";
import path from "path";

i18n.configure({
    locales: ["en", "hi", "gu"],
    directory: path.join(__dirname, "../locales/"),
    defaultLocale: "en",
    queryParameter: "lang", // ?lang=gu
    autoReload: true,
    syncFiles: true,
});

export default i18n;