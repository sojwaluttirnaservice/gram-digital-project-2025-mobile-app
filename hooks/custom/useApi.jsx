import { useSelector } from "react-redux";
import { instance } from "../../api/createApiClient";

const useApi = () => {
    const { serverUrl } = useSelector((state) => state.connection);
    const api = instance(serverUrl);
    return api;
};

export default useApi;
