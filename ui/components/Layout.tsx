import { motion } from 'framer-motion';

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <main className="flex justify-center
    pl-24 pr-24
    bg-gradient-to-br 
    from-pastel-blue to-pastel-lavender dark:from-dark-primary dark:to-dark-secondary min-h-screen">
      <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.5 }} 
          className="max-w-screen-2xl 
          w-full
          lg:mx-12 bg-white dark:bg-dark-800"
        >
        {children}
      </motion.div>
    </main>
  );
};

export default Layout;