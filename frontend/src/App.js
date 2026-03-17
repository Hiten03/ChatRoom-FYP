// import './App.css';
// import { BrowserRouter, Switch, Route, Redirect } from 'react-router-dom';
// import Home from './pages/Home/Home';
// import Navigation from './components/shared/Navigation/Navigation';
// import Authenticate from './pages/Authenticate/Authenticate';
// import Activate from './pages/Activate/Activate';
// import Rooms from './pages/Rooms/Rooms';
// import { useSelector } from 'react-redux';

// function App() {
//     return (
//         <BrowserRouter>
//             <Navigation />
//             <Switch>
//                 <GuestRoute path="/" exact>
//                     <Home />
//                 </GuestRoute>
//                 <GuestRoute path="/authenticate">
//                     <Authenticate />
//                 </GuestRoute>
//                 <SemiProtectedRoute path="/activate">
//                     <Activate />
//                 </SemiProtectedRoute>
//                 <ProtectedRoute path="/rooms">
//                     <Rooms />
//                 </ProtectedRoute>
//             </Switch>
//         </BrowserRouter>
//     );
// }

// const GuestRoute = ({ children, ...rest }) => {
//     const { isAuth } = useSelector((state) => state.auth);
//     return (
//         <Route
//             {...rest}
//             render={({ location }) => {
//                 return isAuth ? (
//                     <Redirect
//                         to={{
//                             pathname: '/rooms',
//                             state: { from: location },
//                         }}
//                     />
//                 ) : (
//                     children
//                 );
//             }}
//         ></Route>
//     );
// };

// const SemiProtectedRoute = ({ children, ...rest }) => {
//     const { user, isAuth } = useSelector((state) => state.auth);
//     return (
//         <Route
//             {...rest}
//             render={({ location }) => {
//                 return !isAuth ? (
//                     <Redirect
//                         to={{
//                             pathname: '/',
//                             state: { from: location },
//                         }}
//                     />
//                 ) : isAuth && !user.activated ? (
//                     children
//                 ) : (
//                     <Redirect
//                         to={{
//                             pathname: '/rooms',
//                             state: { from: location },
//                         }}
//                     />
//                 );
//             }}
//         ></Route>
//     );
// };

// const ProtectedRoute = ({ children, ...rest }) => {
//     const { user, isAuth } = useSelector((state) => state.auth);
//     return (
//         <Route
//             {...rest}
//             render={({ location }) => {
//                 return !isAuth ? (
//                     <Redirect
//                         to={{
//                             pathname: '/',
//                             state: { from: location },
//                         }}
//                     />
//                 ) : isAuth && !user.activated ? (
//                     <Redirect
//                         to={{
//                             pathname: '/activate',
//                             state: { from: location },
//                         }}
//                     />
//                 ) : (
//                     children
//                 );
//             }}
//         ></Route>
//     );
// };

// export default App;




import './App.css';
import './App.module.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home/Home';
import Navigation from './components/shared/Navigation/Navigation';
import Authenticate from './pages/Authenticate/Authenticate';
import Activate from './pages/Activate/Activate';
import Rooms from './pages/Rooms/Rooms';
import Room from './pages/Room/Room';
import { useSelector } from 'react-redux';
import { useLoadingWithRefresh } from './hooks/useLoadingWithRefresh';
import Loader from './components/shared/Loader/Loader';

function App() {
    
    //call refresh endpoint
    const { loading } = useLoadingWithRefresh();

    return loading ? (
        <Loader message = "Loading, please wait..." />
    ) : (
        <BrowserRouter>
            <header style={{
                position: 'sticky',
                top: 0,
                zIndex: 100,
                background: 'var(--navbar-bg)',
                backdropFilter: 'blur(18px)',
                WebkitBackdropFilter: 'blur(18px)',
                borderBottom: '1px solid var(--border)',
                transition: 'background-color 0.3s ease, border-color 0.3s ease',
            }}>
                <Navigation />
            </header>
            <Routes>
                <Route path="/" element={<GuestRoute><Home /></GuestRoute>} />
                <Route path="/authenticate" element={<GuestRoute><Authenticate /></GuestRoute>} />
                <Route path="/activate" element={<SemiProtectedRoute><Activate /></SemiProtectedRoute>} />
                <Route path="/rooms" element={<ProtectedRoute><Rooms /></ProtectedRoute>} />
                <Route path="/room/:id" element={<ProtectedRoute><Room /></ProtectedRoute>} />
            </Routes>
        </BrowserRouter>
    );
}

const GuestRoute = ({ children }) => {
    const { isAuth } = useSelector((state) => state.auth);

    return isAuth ? (
        <Navigate to="/rooms" />
    ) : (
        children
    );
};

const SemiProtectedRoute = ({ children }) => {
    const { user, isAuth } = useSelector((state) => state.auth);

    if (!isAuth) {
        return <Navigate to="/" />;
    }

    if (isAuth && !user.activated) {
        return children;
    }

    return <Navigate to="/rooms" />;
};

const ProtectedRoute = ({ children }) => {
    const { user, isAuth } = useSelector((state) => state.auth);

    if (!isAuth) {
        return <Navigate to="/" />;
    }

    if (isAuth && !user.activated) {
        return <Navigate to="/activate" />;
    }

    return children;
};

export default App;
