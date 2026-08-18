export const getWelcome = (req: any, res: any) => {
    res.json({
        message: res.__("WELCOME"),
    });
};