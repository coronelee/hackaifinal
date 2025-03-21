import styles from './styles/app.module.css';

import Header from './components/Header.jsx';
import VoiceRecord from './components/VoiceRecord.jsx';
import MainCanvas from './components/MainCanvas.jsx';

function App() {
  return (
    <div className={styles.app}> 
      <Header />
      <MainCanvas/>
      <VoiceRecord />
    </div>
  );
}

export default App;
