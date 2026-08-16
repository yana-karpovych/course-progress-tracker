import { Route, Routes } from 'react-router-dom';
import CourseDetailsPage from './pages/CourseDetailsPage';
import CoursesPage from './pages/CoursesPage';

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Course Progress Tracker</h1>
      </header>
      <main className="app-main">
        <Routes>
          <Route path="/" element={<CoursesPage />} />
          <Route path="/courses/:id" element={<CourseDetailsPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
