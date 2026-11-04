import Admins from "../pages/admins/admins";
import Collaction from "../pages/Collaction/collaction";
import CollactionAdd from "../pages/Collaction/collactionAdd";
import Dashboard from "../pages/Dashboard/dashboard";
import Elonlar from "../pages/Elonlar/elonlar";
import ElonlarAdd from "../pages/Elonlar/elonlarAdd";
import Gallery from "../pages/Gallery/gallery";
import GalleryAdd from "../pages/Gallery/galleryAdd";
import News from "../pages/News/news";
import NewsAdd from "../pages/News/newsAdd";
import Requests from "../pages/requests/requests";
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
    {
        id:6,
        path:"/elonlar",
        element:<Elonlar/>
    },
    {
        id:7,
        path:"/elonlar/add",
        element:<ElonlarAdd/>
    },
    {
        id:8,
        path:"/gallery",
        element:<Gallery/>
    },
    {
        id:9,
        path:"/gallery/add",
        element:<GalleryAdd/>
    },
    {
        id:10,
        path:"/adminlar",
        element:<Admins/>
    },
    {
        id:11,
        path:"/requests",
        element:<Requests/>
    }
]