import i18n from "../config/i18n";

const languageMiddleware = (req: any, res: any, next: any) => {
    let lang = req.query.lang; // 👈 from ?lang=gu

    if (!lang) {
        lang = "en"; // default fallback
    }

    i18n.setLocale(req, lang);

    next();
};

export default languageMiddleware;