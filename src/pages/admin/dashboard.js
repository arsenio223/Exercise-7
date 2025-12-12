import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import Link from 'next/link';

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    faculties: 0,
    students: 0,
    evaluationForms: 0,
    submittedEvaluations: 0,
    classes: 0,
    subjects: 0,
    academicYears: 0,
    pendingEvaluations: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const router = useRouter();

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // Helper function to get user initials
  const getAdminInitials = () => {
    if (user?.firstname && user?.lastname) {
      return `${user.firstname[0]}${user.lastname[0]}`.toUpperCase();
    }
    return 'AD';
  };

  // Helper function to get avatar color based on name
  const getAdminAvatarColor = () => {
    const colors = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
    ];
    
    const name = `${user?.firstname || ''}${user?.lastname || ''}`;
    if (!name) return colors[0];
    
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  // Format time for display
  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  useEffect(() => {
    checkAuthAndFetchData();
  }, [router]);

  const checkAuthAndFetchData = async () => {
    try {
      // Check authentication
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');

      if (!token || !userData) {
        router.push('/login');
        return;
      }

      let parsedUser;
      try {
        parsedUser = JSON.parse(userData);
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.clear();
        router.push('/login');
        return;
      }

      // Check if user is admin
      const userType = parsedUser.userType || parsedUser.user_type;
      const isAdmin = userType === 'admin' || userType === 1;

      if (!isAdmin) {
        router.push('/unauthorized');
        return;
      }

      setUser(parsedUser);
      await fetchDashboardData();
    } catch (error) {
      console.error('Authentication error:', error);
      setError('Failed to authenticate. Please login again.');
    }
  };

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Fetching dashboard data...');
      
      // Fetch all statistics in parallel
      const [
        facultyRes,
        studentRes,
        evalFormRes,
        submittedEvalRes,
        classRes,
        subjectRes,
        academicYearRes,
        pendingEvalRes
      ] = await Promise.all([
        fetch('/api/admin/dashboard/stats?type=faculty', {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }).catch(err => {
          console.error('Error fetching faculty:', err);
          return { ok: false };
        }),
        fetch('/api/admin/dashboard/stats?type=student', {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }).catch(err => {
          console.error('Error fetching students:', err);
          return { ok: false };
        }),
        fetch('/api/admin/evaluation-forms?countOnly=true', {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }).catch(err => {
          console.error('Error fetching evaluation forms:', err);
          return { ok: false };
        }),
        fetch('/api/admin/evaluations/list?countOnly=true', {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }).catch(err => {
          console.error('Error fetching submitted evaluations:', err);
          return { ok: false };
        }),
        fetch('/api/admin/dashboard/stats?type=class', {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }).catch(err => {
          console.error('Error fetching classes:', err);
          return { ok: false };
        }),
        fetch('/api/admin/dashboard/stats?type=subject', {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }).catch(err => {
          console.error('Error fetching subjects:', err);
          return { ok: false };
        }),
        fetch('/api/admin/dashboard/stats?type=academic-year', {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }).catch(err => {
          console.error('Error fetching academic years:', err);
          return { ok: false };
        }),
        fetch('/api/admin/evaluations?status=pending&countOnly=true', {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }).catch(err => {
          console.error('Error fetching pending evaluations:', err);
          return { ok: false };
        })
      ]);

      // Parse all responses
      const [
        facultyData,
        studentData,
        evalFormData,
        submittedEvalData,
        classData,
        subjectData,
        academicYearData,
        pendingEvalData
      ] = await Promise.all([
        facultyRes.ok ? facultyRes.json() : { success: false },
        studentRes.ok ? studentRes.json() : { success: false },
        evalFormRes.ok ? evalFormRes.json() : { success: false },
        submittedEvalRes.ok ? submittedEvalRes.json() : { success: false },
        classRes.ok ? classRes.json() : { success: false },
        subjectRes.ok ? subjectRes.json() : { success: false },
        academicYearRes.ok ? academicYearRes.json() : { success: false },
        pendingEvalRes.ok ? pendingEvalRes.json() : { success: false }
      ]);

      // Update stats
      setStats({
        faculties: facultyData.success ? facultyData.count || facultyData.total || 0 : 0,
        students: studentData.success ? studentData.count || studentData.total || 0 : 0,
        evaluationForms: evalFormData.success ? evalFormData.count || evalFormData.data?.length || evalFormData.length || 0 : 0,
        submittedEvaluations: submittedEvalData.success ? submittedEvalData.count || submittedEvalData.data?.length || submittedEvalData.length || 0 : 0,
        classes: classData.success ? classData.count || classData.total || 0 : 0,
        subjects: subjectData.success ? subjectData.count || subjectData.total || 0 : 0,
        academicYears: academicYearData.success ? academicYearData.count || academicYearData.total || 0 : 0,
        pendingEvaluations: pendingEvalData.success ? pendingEvalData.count || pendingEvalData.data?.length || pendingEvalData.length || 0 : 0
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data. Please try again.');
      
      await fetchFallbackData();
    } finally {
      setLoading(false);
    }
  };

  const fetchFallbackData = async () => {
    try {
      const token = localStorage.getItem('token');
      const endpoints = [
        { key: 'faculties', url: '/api/faculty?countOnly=true' },
        { key: 'students', url: '/api/students?countOnly=true' },
        { key: 'evaluationForms', url: '/api/admin/evaluation-forms?countOnly=true' },
        { key: 'submittedEvaluations', url: '/api/admin/evaluations/list?countOnly=true' },
        { key: 'classes', url: '/api/classes?countOnly=true' },
        { key: 'subjects', url: '/api/subjects?countOnly=true' },
        { key: 'academicYears', url: '/api/academic-years?countOnly=true' },
        { key: 'pendingEvaluations', url: '/api/admin/evaluations?status=pending&countOnly=true' }
      ];

      const statsData = { ...stats };

      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint.url, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const data = await response.json();
          if (data.success || response.ok) {
            statsData[endpoint.key] = data.count || data.total || data.data?.length || data.length || 0;
          }
        } catch (err) {
          console.error(`Error fetching ${endpoint.key}:`, err);
        }
      }

      setStats(statsData);
    } catch (error) {
      console.error('Error in fallback data fetch:', error);
    }
  };

  // Custom Stat Card with unique design
  const StatCard = ({ title, value, icon, color, link, trend }) => (
    <Link href={link || '#'}>
      <div className="relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-white via-white to-gray-50 transform group-hover:scale-105 transition-transform duration-300 rounded-2xl"></div>
        <div className="relative bg-white/80 backdrop-blur-sm border border-gray-100 rounded-2xl p-6 shadow-sm group-hover:shadow-lg transition-all duration-300">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center">
              <div className={`p-3 rounded-xl ${color.bg} shadow-sm`}>
                <div className={color.text}>
                  {icon}
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-600 tracking-wide uppercase">{title}</h3>
                <p className="text-3xl font-bold text-gray-800 mt-1">{value}</p>
              </div>
            </div>
            {trend && (
              <div className={`text-xs font-medium px-2 py-1 rounded-full ${trend.color}`}>
                {trend.value}
              </div>
            )}
          </div>
          <div className="text-xs text-gray-400 font-medium mt-4">
            <span className="inline-flex items-center">
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              View details
            </span>
          </div>
        </div>
      </div>
    </Link>
  );

  // Quick Action Button Component
  const QuickActionButton = ({ title, icon, color, onClick }) => (
    <button
      onClick={onClick}
      className="bg-white border border-gray-100 rounded-xl p-4 flex flex-col items-center justify-center hover:shadow-md hover:border-gray-200 transition-all duration-200 group"
    >
      <div className={`p-3 rounded-lg ${color.bg} ${color.text} mb-3 group-hover:scale-110 transition-transform duration-200`}>
        {icon}
      </div>
      <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">{title}</span>
      <span className="text-xs text-gray-400 mt-1">Click to access</span>
    </button>
  );

  if (loading) {
    return (
      <Layout user={user}>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-white">
          <div className="text-center">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-gray-200 rounded-full"></div>
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
            </div>
            <p className="mt-4 text-gray-600 font-medium">Loading dashboard...</p>
            <p className="text-sm text-gray-400 mt-1">Preparing your administrative workspace</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout user={user}>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-white">
          <div className="text-center max-w-md mx-auto p-8">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">System Error</h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={checkAuthAndFetchData}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-sm hover:shadow"
              >
                Retry Connection
              </button>
              <button
                onClick={() => router.push('/login')}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Re-login
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout user={user}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
        <div className="p-6 max-w-7xl mx-auto">
          {/* Modern Header with Gradient Background */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 shadow-xl mb-8">
            <div className="absolute inset-0 bg-grid-white/10 bg-grid-8"></div>
            <div className="relative px-8 py-10">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                <div className="mb-6 lg:mb-0 lg:mr-8">
                  <div className="flex items-center mb-4">
                    <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mr-4">
                      {user?.profile_picture || user?.profilePicture ? (
                        <img
                          src={(user.profile_picture || user.profilePicture).startsWith('http') || (user.profile_picture || user.profilePicture).startsWith('/') 
                            ? (user.profile_picture || user.profilePicture)
                            : `/${user.profile_picture || user.profilePicture}`}
                          alt={`${user?.firstname || ''} ${user?.lastname || ''}`}
                          className="w-14 h-14 rounded-xl object-cover"
                          onError={(e) => {
                            console.log('Profile picture failed to load, using fallback');
                            e.target.src = '/uploads/default-avatar.png';
                          }}
                        />
                      ) : (
                        <div 
                          className="w-14 h-14 rounded-xl flex items-center justify-center text-white text-xl font-bold"
                          style={{ background: getAdminAvatarColor() }}
                        >
                          {getAdminInitials()}
                        </div>
                      )}
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold text-white mb-1">
                        Welcome back, {user?.firstname}!
                      </h1>
                      <p className="text-white/90">
                        System Administrator • {user?.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
                      <p className="text-xs text-white/80">Admin ID</p>
                      <p className="text-white font-semibold">{user?.school_id || user?.admin_id || 'SYSTEM-ADMIN'}</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
                      <p className="text-xs text-white/80">Access Level</p>
                      <p className="text-white font-semibold">Full System Access</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
                      <p className="text-xs text-white/80">Session</p>
                      <p className="text-white font-semibold">Active</p>
                    </div>
                  </div>
                </div>
                
                {/* Time and Date Widget */}
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 min-w-[280px]">
                  <div className="text-center">
                    <div className="text-5xl font-bold text-white mb-2 font-mono">
                      {formatTime(currentTime)}
                    </div>
                    <div className="text-white/90">
                      {currentTime.toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </div>
                  
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Dashboard Overview Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">System Overview</h2>
                <p className="text-gray-600 mt-1">Comprehensive view of all system metrics and activities</p>
              </div>
              <div className="text-sm text-gray-500">
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-700">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                  Real-time Data
                </span>
              </div>
            </div>

            {/* Stats Grid - 2 Columns Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* First Column */}
              <div className="space-y-6">
                {/* User Management Stats */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-1.205a21.4 21.4 0 00-2.427-5.07M15.75 9.75h.008v.008h-.008V9.75zm-7.5 0h.008v.008h-.008V9.75z" />
                    </svg>
                    User Management
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <StatCard
                      title="Faculty Members"
                      value={stats.faculties}
                      icon={
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      }
                      color={{ bg: 'bg-blue-50', text: 'text-blue-600' }}
                      link="/admin/faculty"
                    />

                    <StatCard
                      title="Students"
                      value={stats.students}
                      icon={
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 0c-.281.02-.559.04-.835.062A23.493 23.493 0 0112 15c-2.392 0-4.744.175-7.043.513A48.45 48.45 0 002 19" />
                        </svg>
                      }
                      color={{ bg: 'bg-green-50', text: 'text-green-600' }}
                      link="/admin/students"
                    />
                  </div>
                </div>

                {/* Academic Structure Stats */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    Academic Structure
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <StatCard
                      title="Classes"
                      value={stats.classes}
                      icon={
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      }
                      color={{ bg: 'bg-orange-50', text: 'text-orange-600' }}
                      link="/admin/classes"
                    />

                    <StatCard
                      title="Subjects"
                      value={stats.subjects}
                      icon={
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      }
                      color={{ bg: 'bg-indigo-50', text: 'text-indigo-600' }}
                      link="/admin/subjects"
                    />
                  </div>
                </div>
              </div>

              {/* Second Column */}
              <div className="space-y-6">
                {/* Evaluation Management Stats */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Evaluation Management
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <StatCard
                      title="Active Forms"
                      value={stats.evaluationForms}
                      icon={
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      }
                      color={{ bg: 'bg-purple-50', text: 'text-purple-600' }}
                      link="/admin/evaluations"
                    />

                    
                  </div>
                </div>

                {/* System Metrics Stats */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    System Metrics
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                   

                    <StatCard
                      title="Academic Years"
                      value={stats.academicYears}
                      icon={
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      }
                      color={{ bg: 'bg-pink-50', text: 'text-pink-600' }}
                      link="/admin/academic-years"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Access Panel */}
          <div className="mb-8">
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Quick Access</h2>
                  <p className="text-gray-600 mt-1">Frequently used administrative actions</p>
                </div>
                <div className="text-sm text-gray-500">
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-gray-50 text-gray-700">
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Direct Actions
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              

                <QuickActionButton
                  title="Create Form"
                  icon={
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                  }
                  color={{ bg: 'bg-purple-50', text: 'text-purple-600' }}
                  onClick={() => router.push('/admin/evaluations/create')}
                />

                <QuickActionButton
                  title="View Reports"
                  icon={
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  }
                  color={{ bg: 'bg-orange-50', text: 'text-orange-600' }}
                  onClick={() => router.push('/admin/reports')}
                />
              </div>
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
}
