import { type RouteConfig, layout, route } from '@react-router/dev/routes';

export default [
  layout('app/layouts/main-layout.tsx', [
    route('/', './pages/home.tsx'),
    route('/chat', './pages/chat.tsx'),
  ]),
  route('*?', 'catchall.tsx'),

  route('/about', './pages/about.tsx'),
  route('/login', './pages/login.tsx'),
  route('/signup', './pages/signup.tsx'),
] satisfies RouteConfig;
