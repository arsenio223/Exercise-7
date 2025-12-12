import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function Layout({ children, user }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profilePictureUrl, setProfilePictureUrl] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (user) {
      console.log('👤 Layout received user:', {
        name: `${user.firstname} ${user.lastname}`,
        email: user.email,
        profile_picture: user.profile_picture,
        avatar: user.avatar
      });
      
      // Get profile picture - check multiple possible field names
      let pictureUrl = user.profile_picture || user.profilePicture || user.avatar;
      
      console.log('🖼️ Profile picture found:', pictureUrl);
      
      if (pictureUrl && pictureUrl !== 'null' && pictureUrl !== 'undefined') {
        // Fix path if needed
        if (!pictureUrl.startsWith('http') && !pictureUrl.startsWith('/')) {
          pictureUrl = '/' + pictureUrl;
        }
        
        // Ensure it's from uploads folder
        if (pictureUrl.includes('uploads')) {
          // Normalize path
          pictureUrl = pictureUrl.replace(/^.*?(uploads\/)/, '/uploads/');
        }
        
        setProfilePictureUrl(pictureUrl);
      } else {
        // Use default avatar
        console.log('🖼️ Using default avatar');
        setProfilePictureUrl('/uploads/default-avatar.png');
      }
    }
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const getNavigation = () => {
    if (!user) return [];
    
    const baseNav = [
      { href: '/dashboard', label: 'Dashboard', icon: '🏠' },
    ];

    const userType = user.userType || user.user_type;
    
    switch(userType) {
      case 1:
      case 'admin':
        return [
          ...baseNav,
          { href: '/admin/faculty', label: 'Faculty Management', icon: '👨‍🏫' },
          { href: '/admin/students', label: 'Student Management', icon: '👨‍🎓' },
          { href: '/admin/classes', label: 'Class Management', icon: '🏫' },
          { href: '/admin/subjects', label: 'Subject Management', icon: '📚' },
          { href: '/admin/evaluations', label: 'All Evaluations', icon: '📊' },
          { href: '/admin/reports', label: 'Evaluation Reports', icon: '📈' },
          { href: '/admin/academic-years', label: 'Academic Years', icon: '📅' },
        ];
      case 2:
      case 'faculty':
        return [
          ...baseNav,
          { href: '/faculty/evaluations', label: 'My Evaluations', icon: '📝' },
        ];
      case 3:
      case 'student':
        return [
          ...baseNav,
          { href: '/student/evaluations', label: 'My Evaluations', icon: '📝' },
        ];
      default:
        return baseNav;
    }
  };

  // Get user type display name
  const getUserTypeDisplay = () => {
    const userType = user?.userType || user?.user_type;
    switch(userType) {
      case 1:
      case 'admin':
        return 'Administrator';
      case 2:
      case 'faculty':
        return 'Faculty';
      case 3:
      case 'student':
        return 'Student';
      default:
        return 'User';
    }
  };

  // Get user initials
  const getUserInitials = () => {
    if (user?.firstname && user?.lastname) {
      return `${user.firstname[0]}${user.lastname[0]}`.toUpperCase();
    } else if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return 'U';
  };

  // Get background color for avatar based on name
  const getAvatarColor = () => {
    const name = `${user?.firstname || ''}${user?.lastname || ''}`;
    if (!name) return '#3b82f6';
    
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = hash % 360;
    return `hsl(${hue}, 70%, 60%)`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div className="ml-4 flex items-center">
                <h1 className="text-xl font-bold text-gray-800">Faculty Evaluation System</h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="hidden md:flex items-center space-x-4">
                {/* Profile Picture - LARGER VERSION */}
                <div className="relative">
                  {profilePictureUrl ? (
                    <img
                      src={profilePictureUrl}
                      alt={`${user?.firstname || ''} ${user?.lastname || ''}`}
                      className="w-16 h-16 rounded-full object-cover border-3 border-white shadow-lg"
                      onError={(e) => {
                        console.log('❌ Image failed to load:', profilePictureUrl);
                        e.target.src = '/uploads/default-avatar.png';
                      }}
                      onLoad={() => console.log('✅ Profile picture loaded:', profilePictureUrl)}
                    />
                  ) : (
                    <div 
                      className="w-16 h-16 rounded-full flex items-center justify-center text-white font-semibold shadow-lg text-xl"
                      style={{ backgroundColor: getAvatarColor() }}
                    >
                      {getUserInitials()}
                    </div>
                  )}
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    {user?.firstname} {user?.lastname}
                  </p>
                  <p className="text-xs text-gray-500">
                    {getUserTypeDisplay()}
                  </p>
                </div>
              </div>
              
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar for Desktop */}
        <aside className="hidden md:flex md:w-64">
          <div className="w-64 bg-white shadow h-[calc(100vh-5rem)] sticky top-20 overflow-y-auto">
            <nav className="p-4 space-y-1">
              {getNavigation().map((item) => (
                <Link 
                  key={item.href} 
                  href={item.href}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition ${
                    router.pathname === item.href || router.pathname.startsWith(item.href + '/')
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </aside>

        {/* Mobile Sidebar */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
              <div className="p-4">
                {/* Mobile Profile Info - LARGER VERSION */}
                <div className="flex items-center mb-6">
                  <div className="relative mr-4">
                    {profilePictureUrl ? (
                      <img
                        src={profilePictureUrl}
                        alt={`${user?.firstname || ''} ${user?.lastname || ''}`}
                        className="w-20 h-20 rounded-full object-cover border-3 border-white shadow-lg"
                        onError={(e) => {
                          e.target.src = '/uploads/default-avatar.png';
                        }}
                      />
                    ) : (
                      <div 
                        className="w-20 h-20 rounded-full flex items-center justify-center text-white font-semibold text-2xl"
                        style={{ backgroundColor: getAvatarColor() }}
                      >
                        {getUserInitials()}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-base font-medium text-gray-700">
                      {user?.firstname} {user?.lastname}
                    </p>
                    <p className="text-sm text-gray-500">{getUserTypeDisplay()}</p>
                  </div>
                </div>
                
                <nav className="space-y-1">
                  {getNavigation().map((item) => (
                    <Link 
                      key={item.href} 
                      href={item.href}
                      className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition ${
                        router.pathname === item.href || router.pathname.startsWith(item.href + '/')
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <span className="mr-3">{item.icon}</span>
                      {item.label}
                    </Link>
                  ))}
                </nav>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
