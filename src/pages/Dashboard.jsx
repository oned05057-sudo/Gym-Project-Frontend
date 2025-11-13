import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Upload, Users, Calendar, Dumbbell, Activity, TrendingUp } from 'lucide-react';
import Navbar from '../components/Navbar.jsx';
import { authApi } from '../mocks/mockApi.js';
import { useSelector } from 'react-redux';
import TakeTest from '../components/TakeTest.jsx';

const Dashboard = () => {
  const currentUser = authApi.getCurrentUser();
  const {totalMembers}=useSelector((state)=>state.dataSlice)
  const {totalExercies}=useSelector((state)=>state.dataSlice)

  const quickActions = [
    {
      title: 'Upload Users',
      description: 'Import members from a CSV file',
      icon: Upload,
      path: '/upload-users',
      color: 'bg-blue-500 hover:bg-blue-600',
    },
    {
      title: 'View Gym Members',
      description: 'Manage and view all members',
      icon: Users,
      path: '/members',
      color: 'bg-green-500 hover:bg-green-600',
    },
    {
      title: 'Create Routine',
      description: 'Design personalized workout routines',
      icon: Calendar,
      path: '/create-routine',
      color: 'bg-purple-500 hover:bg-purple-600',
    },
    {
      title: 'Create Exercise',
      description: 'Add new exercises to the library',
      icon: Dumbbell,
      path: '/create-exercise',
      color: 'bg-red-500 hover:bg-red-600',
    }
  ];

  const stats = [
    {
      title: 'Total Members',
      value: totalMembers.length,
      icon: Users,
      change: '+12%',
      changeType: 'positive'
    },
    {
      title: 'Active Routines',
      value: '45',
      icon: Activity,
      change: '+5%',
      changeType: 'positive'
    },
    {
      title: 'Exercises Available',
      value: totalExercies.length,
      icon: Dumbbell,
      change: '+8%',
      changeType: 'positive'
    },
    {
      title: 'Monthly Growth',
      value: '18%',
      icon: TrendingUp,
      change: '+3%',
      changeType: 'positive'
    }
  ];



  return (
    <div className="relative min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* Background video from public/bg.mp4 - put your file in public/ and name it bg.mp4 or change the src */}
      <video
        className="absolute inset-0 w-full h-full object-cover"
        src="bg.mp4"
        autoPlay
        muted
        loop
        playsInline
        aria-hidden="true"
        poster="/bg-poster.jpg"
      />
      {/* Optional overlay to improve contrast */}
      {/* <div className="absolute inset-0 bg-black/40 -z-5 pointer-events-none" /> */}

      <div className="relative z-10">
        <Navbar />

        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="bg-gradient-to-r from-primary to-secondary rounded-2xl p-8 text-primary-foreground shadow-lg">
            <h1 className="text-3xl font-bold mb-2">
              Welcome back, {currentUser?.name || 'Gym Owner'}!
            </h1>
            <p className="text-lg opacity-90">
              Here's a quick overview of your gym's performance.
            </p>
          </div>
        </motion.div>
        {/* <video src="bg.mp4"
        autoPlay
        ></video> */}

        {/* Stats Grid */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div 
                key={index} 
                className="bg-card rounded-xl shadow-md border border-border p-6 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 * index }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                  </div>
                  <div className="bg-primary/10 p-3 rounded-xl">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <div className="mt-4">
                  <span className={`text-sm font-medium ${
                    stat.changeType === 'positive' ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {stat.change}
                  </span>
                  <span className="text-sm text-muted-foreground"> from last month</span>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Quick Actions */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <h2 className="text-2xl font-bold text-foreground mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 * index }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Link
                    to={action.path}
                    className={`group block rounded-2xl p-6 text-white shadow-lg transition-all duration-300 ${action.color}`}>
                      <Icon className="h-10 w-10 mb-4 opacity-80 group-hover:opacity-100" />
                      <h3 className="text-lg font-semibold mb-1">{action.title}</h3>
                      <p className="text-sm opacity-90">{action.description}</p>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div 
          className="bg-card rounded-2xl shadow-md border border-border p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <h2 className="text-xl font-bold text-foreground mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {[
              // { action: 'New member registered', member: `${totalMembers[0].name}`, time: '2 hours ago' },
              { action: 'Routine created', member: 'Later Updated', time: '4 hours ago' },
              // { action: 'Exercise added', member: `${totalExercies[totalExercies.length-1].name}`, time: '1 day ago' },
              // { action: 'Member updated', member: `${totalMembers[0].name}`, time: '2 days ago' }
            ].map((activity, index) => (
              <motion.div 
                key={index} 
                className="flex items-center space-x-4 p-3 rounded-xl hover:bg-accent transition-colors duration-200"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.1 * index }}
              >
                <div className="bg-primary/10 p-2 rounded-xl">
                  <Activity className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{activity.action}</p>
                  <p className="text-xs text-muted-foreground">{activity.member}</p>
                </div>
                <div className="text-xs text-muted-foreground">
                  {activity.time}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
    {/* <TakeTest></TakeTest> */}
    </div>
  );
};

export default Dashboard;
