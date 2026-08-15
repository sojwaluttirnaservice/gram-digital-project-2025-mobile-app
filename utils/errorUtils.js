export const getErrorMessage = (err, defaultMessage = "An error occurred.") => {
    if (!err.response) {
        return "Unable to connect to service or server.";
    }
    return err?.response?.data?.message || defaultMessage;
};
