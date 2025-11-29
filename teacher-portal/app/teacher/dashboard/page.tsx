'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { User, User as UserIcon, Mail, BookOpen, MessageSquare, LogOut } from 'lucide-react';

// Mock student data generator
const generateMockStudents = (count = 10) => {
  const firstNames = ['Alex', 'Jordan', 'Taylor', 'Casey', 'Riley', 'Jamie', 'Quinn', 'Morgan', 'Avery', 'Peyton'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
  const subjects = ['Math', 'Science', 'English', 'History', 'Art', 'Music', 'PE', 'Computer Science'];
  
  return Array.from({ length: count }, (_, i) => ({
    id: `student-${i + 1}`,
    name: `${firstNames[i % firstNames.length]} ${lastNames[i % lastNames.length]}`,
    email: `student${i + 1}@example.com`,
    grade: Math.floor(Math.random() * 40) + 60, // Random grade between 60-100
    subject: subjects[Math.floor(Math.random() * subjects.length)],
    lastActive: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    feedback: [
      'Great participation in class!',
      'Needs to complete homework on time.',
      'Excellent understanding of the material.',
      'Could benefit from extra practice.',
      'Very engaged in discussions.',
      'Shows great potential.'
    ][Math.floor(Math.random() * 6)]
  }));
};

export default function TeacherDashboard() {
  const [user, setUser] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }
      
      setUser(user);
      
      // In a real app, you would fetch this from your database
      // For now, we'll use mock data
      setStudents(generateMockStudents(12));
      setLoading(false);
    };

    checkUser();
  }, [router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Teacher Dashboard</h1>
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <UserIcon className="h-6 w-6 text-gray-500 mr-2" />
              <span className="text-gray-700">{user?.email}</span>
            </div>
            <button
              onClick={handleSignOut}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h2 className="text-lg leading-6 font-medium text-gray-900">My Students</h2>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">View and manage your students' progress</p>
          </div>
          
          {/* Students Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subject
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Grade
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Active
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Feedback
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <User className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{student.name}</div>
                          <div className="text-sm text-gray-500">{student.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{student.subject}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${student.grade >= 80 ? 'bg-green-100 text-green-800' : student.grade >= 60 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                        {student.grade}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {student.lastActive}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {student.feedback}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Stats */}
          <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <div className="text-center">
              <dt className="text-sm font-medium text-gray-500 truncate">Total Students</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">{students.length}</dd>
            </div>
            <div className="text-center mt-5 sm:mt-0">
              <dt className="text-sm font-medium text-gray-500 truncate">Average Grade</dt>
              <dd className="mt-1 text-3xl font-semibold text-blue-600">
                {Math.round(students.reduce((sum, student) => sum + student.grade, 0) / students.length)}%
              </dd>
            </div>
            <div className="text-center mt-5 sm:mt-0">
              <dt className="text-sm font-medium text-gray-500 truncate">Active This Week</dt>
              <dd className="mt-1 text-3xl font-semibold text-green-600">
                {students.filter(s => new Date(s.lastActive) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length}
              </dd>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
