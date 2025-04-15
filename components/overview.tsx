import { motion } from 'framer-motion';
import Link from 'next/link';

import { MessageIcon } from './icons';

export const Overview = () => {
  return (
    <motion.div
      key="overview"
      className="max-w-3xl mx-auto md:mt-20"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ delay: 0.5 }}
    >
      <div className="rounded-xl p-6 flex flex-col gap-8 leading-relaxed text-center max-w-xl">
        
        <p className="flex flex-row justify-center gap-4 items-center">
          <img src="/images/image_logo.png" alt="Prima Banka Logo" width={200} />
        </p>
        
        <h2 className="text-2xl font-bold">Máš otázku?</h2>
        
        <p>
          Zoznám sa s naším AI asistentom Prima Banky.
          <br/>
          <br/>
          Pomôže ti s rôznymi bankovými úlohami, zodpovie otázky ohľadom tvojich účtov a poradí s financiami.
        </p>
      </div>
    </motion.div>
  );
};
