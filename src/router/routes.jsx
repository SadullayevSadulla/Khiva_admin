import Collaction from "../pages/Collaction/collaction";
import CollactionAdd from "../pages/Collaction/collactionAdd";
import Dashboard from "../pages/Dashboard/dashboard";
import News from "../pages/News/news";
import NewsAdd from "../pages/News/newsAdd";
import Xodimlar from "../pages/Xodimlar/xodimlar";

export const router = [
    {
        id:1,
        path:"/dashboard",
        element:<Dashboard/>
    },
    {
        id:2,
        path:"/xodimlar",
        element:<Xodimlar/>
    },
    {
        id:3,
        path:"/collaction",
        element:<Collaction/>
    },
    {
        id:4,
        path:"/collaction/add",
        element:<CollactionAdd/>
    },
    {
        id:5,
        path:"/news",
        element:<News/>
    },
    {
        id:6,
        path:"/news/add",
        element:<NewsAdd/>
    },
]