import React, { useEffect, useRef, useState } from 'react';
import BpmnModeler from 'bpmn-js/lib/Modeler';
import styles from '../styles/maincanvas.module.css';

export default function MainCanvas() {
  const containerRef = useRef(null);
  const [modeler, setModeler] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Загружаем XML из файла
    const loadDiagram = async () => {
      try {
        const response = await fetch('/diagram.xml');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const bpmnXML = await response.text();

        const modelerInstance = new BpmnModeler({ 
          container: containerRef.current,
          keyboard: {
            bindTo: document
          }
        });

        await modelerInstance.importXML(bpmnXML);
        modelerInstance.get('canvas').zoom('fit-viewport');
        
        setModeler(modelerInstance);
        setLoading(false);
      } catch (err) {
        console.error('Ошибка при загрузке диаграммы:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    loadDiagram();

    return () => {
      if (modeler) {
        modeler.destroy();
      }
    };
  }, []);

  const saveDiagram = async () => {
    if (!modeler) return;
    
    try {
      const { xml } = await modeler.saveXML({ format: true });
      
      // Сохраняем обратно в файл (это будет работать только в development режиме)
      // В production нужно отправлять на сервер
      await fetch('/diagram.xml', {
        method: 'PUT',
        body: xml,
        headers: {
          'Content-Type': 'application/xml'
        }
      });
      
      console.log('Диаграмма сохранена');
    } catch (err) {
      console.error('Ошибка при сохранении диаграммы:', err);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Загрузка диаграммы...</div>;
  }

  if (error) {
    return <div className={styles.error}>Ошибка: {error}</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        {/* <button onClick={saveDiagram} className={styles.button}>
          Сохранить
        </button> */}
      </div>
      <div ref={containerRef} className={styles.xmlViewer}></div>
    </div>
  );
};