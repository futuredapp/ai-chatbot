import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';

import { MessageIcon, VercelIcon } from './icons';

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
          <Image src="/images/rus_logo.svg" alt="RUS Logo" width={100} height={100} />
          
        </p>
        
        <h2 className="text-2xl font-bold">Potřebuješ pomoc?</h2>

        <p className="text-sm text-white-600">
          Rychlá a Účinná změna Skutečnosti pro tvé psychické, fyzické i mentální problémy.
          Pomůžeme ti s emocionálními bloky, negativními přesvědčeními a cestou k vnitřní harmonii.
        </p>
      
        
        <p className="italic text-sm">
          Metoda vytvořená Karlem Nejedlým pro moderního člověka, který hledá praktické a jednoduché řešení.
        </p>
      </div>
    </motion.div>
  );
};
