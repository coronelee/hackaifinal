import React, { useEffect, useRef, useState } from 'react';
import BpmnModeler from 'bpmn-js/lib/Modeler';
import styles from '../styles/maincanvas.module.css';
import { GrGateway } from "react-icons/gr";
import { FaRegCircle } from "react-icons/fa";
import { LuRectangleHorizontal } from "react-icons/lu";
import { FaArrowRight } from "react-icons/fa";

export default function MainCanvas() {
  const containerRef = useRef(null);
  const contextMenuRef = useRef(null);
  const [modeler, setModeler] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [elementName, setElementName] = useState('');
  const [selectedElement, setSelectedElement] = useState(null);
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    element: null
  });
  const [connectionMode, setConnectionMode] = useState(false);
  const [sourceElement, setSourceElement] = useState(null);

  useEffect(() => {
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
        
        // Обработчик выбора элементов
        modelerInstance.on('selection.changed', (event) => {
          const element = event.newSelection && event.newSelection[0];
          setSelectedElement(element || null);
          setElementName(element?.businessObject?.name || '');
        });

        modelerInstance.on('element.changed', (event) => {
          const element = event.element;
          if (element && element === selectedElement) {
            setElementName(element.businessObject?.name || '');
          }
        });

        // Обработчик кликов по canvas
        modelerInstance.on('canvas.click', (event) => {
          if (!connectionMode || !event.element) return;
          
          const elementRegistry = modelerInstance.get('elementRegistry');
          const element = elementRegistry.get(event.element.id);
          
          if (!element) return;

          if (!sourceElement) {
            setSourceElement(element);
            modelerInstance.get('selection').select(element);
          } else {
            createConnection(modelerInstance, sourceElement, element);
            setSourceElement(null);
            setConnectionMode(false);
            modelerInstance.get('selection').deselectAll();
          }
        });

        modelerInstance.on('element.contextmenu', (event) => {
          event.originalEvent.preventDefault();
          const element = event.element;
          
          setContextMenu({
            visible: true,
            x: event.originalEvent.clientX,
            y: event.originalEvent.clientY,
            element: element
          });
        });

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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target)) {
        setContextMenu({...contextMenu, visible: false});
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [contextMenu]);

  const createConnection = (modeler, source, target) => {
    try {
      const modeling = modeler.get('modeling');
      const elementFactory = modeler.get('elementFactory');
      const elementRegistry = modeler.get('elementRegistry');
      
      // Получаем бизнес-объекты элементов
      const sourceBusinessObject = elementRegistry.get(source.id).businessObject;
      const targetBusinessObject = elementRegistry.get(target.id).businessObject;
      
      // Создаем SequenceFlow
      modeling.connect(
        elementRegistry.get(source.id),
        elementRegistry.get(target.id),
        {
          type: 'bpmn:SequenceFlow',
          source: sourceBusinessObject,
          target: targetBusinessObject
        }
      );
    } catch (err) {
      console.error('Ошибка при создании соединения:', err);
      setError(err.message);
    }
  };

  const startConnectionMode = () => {
    setConnectionMode(true);
    setSourceElement(null);
    if (modeler) {
      modeler.get('selection').deselectAll();
    }
  };

  const cancelConnectionMode = () => {
    setConnectionMode(false);
    setSourceElement(null);
    if (modeler) {
      modeler.get('selection').deselectAll();
    }
  };

  const saveDiagram = async () => {
    if (!modeler) return;
    
    try {
      const { xml } = await modeler.saveXML({ format: true });
      
      // В реальном приложении здесь будет вызов API для сохранения
      console.log('XML диаграммы:', xml);
      
      // Для демонстрации просто скачиваем файл
      const blob = new Blob([xml], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'diagram.bpmn';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Ошибка при сохранении диаграммы:', err);
      setError(err.message);
    }
  };

  const addElement = (type) => {
    if (!modeler) return;
    
    try {
      const elementFactory = modeler.get('elementFactory');
      const modeling = modeler.get('modeling');
      const canvas = modeler.get('canvas');
      
      const position = {
        x: canvas.viewbox().x + 100,
        y: canvas.viewbox().y + 100
      };
      
      const shape = elementFactory.createShape({
        type: type
      });
      
      modeling.createShape(shape, position, canvas.getRootElement());
    } catch (err) {
      console.error('Ошибка при добавлении элемента:', err);
      setError(err.message);
    }
  };

  const updateElementName = () => {
    if (!modeler || !selectedElement) return;
    
    try {
      const modeling = modeler.get('modeling');
      modeling.updateLabel(selectedElement, elementName);
    } catch (err) {
      console.error('Ошибка при обновлении имени:', err);
      setError(err.message);
    }
  };

  const deleteElement = () => {
    if (!modeler || !contextMenu.element) return;
    
    try {
      const modeling = modeler.get('modeling');
      modeling.removeElements([contextMenu.element]);
      setContextMenu({...contextMenu, visible: false});
    } catch (err) {
      console.error('Ошибка при удалении элемента:', err);
      setError(err.message);
    }
  };

  const changeElementType = (newType) => {
    if (!modeler || !contextMenu.element) return;
    
    try {
      const modeling = modeler.get('modeling');
      modeling.updateProperties(contextMenu.element, {
        type: newType
      });
      setContextMenu({...contextMenu, visible: false});
    } catch (err) {
      console.error('Ошибка при изменении типа элемента:', err);
      setError(err.message);
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
        <button onClick={saveDiagram} className={styles.button}>
          Сохранить
        </button> 
              
        <button onClick={() => addElement('bpmn:Task')} className={styles.button}>
          <LuRectangleHorizontal />
          <span>Task</span>
        </button>
        <button onClick={() => addElement('bpmn:ExclusiveGateway')} className={styles.button}>
          <GrGateway />
          <span>Gateway</span>
        </button>
        <button onClick={() => addElement('bpmn:StartEvent')} className={styles.button}>
          <FaRegCircle />
          <span>Start</span>
        </button>
        <button onClick={() => addElement('bpmn:EndEvent')} className={styles.button}>
          <FaRegCircle />
          <span>End</span>
        </button>
        
        <button 
          onClick={connectionMode ? cancelConnectionMode : startConnectionMode}
          className={`${styles.button} ${connectionMode ? styles.activeMode : ''}`}
        >
          <FaArrowRight />
          <span>{connectionMode ? 'Отмена' : 'Соединить'}</span>
        </button>
      </div>
      
      {connectionMode && (
        <div className={styles.connectionModeInfo}>
          {sourceElement 
            ? `Выберите целевой элемент (${sourceElement.type.replace('bpmn:', '')} → ?)`
            : 'Выберите исходный элемент'}
          <button onClick={cancelConnectionMode} className={styles.cancelButton}>
            ×
          </button>
        </div>
      )}
      
      <div 
        ref={containerRef} 
        className={`${styles.canvas} ${connectionMode ? styles.connectionMode : ''}`}
      ></div>
      
      {contextMenu.visible && (
        <div 
          ref={contextMenuRef}
          className={styles.contextMenu}
          style={{
            position: 'fixed',
            left: `${contextMenu.x}px`,
            top: `${contextMenu.y}px`,
            zIndex: 1000
          }}
        >
          <div className={styles.contextMenuHeader}>
            {contextMenu.element?.type.replace('bpmn:', '')}
          </div>
          <div className={styles.contextMenuItem} onClick={() => {
            setSelectedElement(contextMenu.element);
            setElementName(contextMenu.element.businessObject?.name || '');
            setContextMenu({...contextMenu, visible: false});
          }}>
            Переименовать
          </div>
          <div className={styles.contextMenuItem} onClick={deleteElement}>
            Удалить
          </div>
          <div className={styles.contextMenuItem} onClick={() => {
            setSourceElement(contextMenu.element);
            setConnectionMode(true);
            setContextMenu({...contextMenu, visible: false});
          }}>
            Создать соединение
          </div>
          <div className={styles.contextMenuDivider}></div>
          <div className={styles.contextMenuSubHeader}>Изменить тип</div>
          <div className={styles.contextMenuItem} onClick={() => changeElementType('bpmn:Task')}>
            Задача
          </div>
          <div className={styles.contextMenuItem} onClick={() => changeElementType('bpmn:ExclusiveGateway')}>
            Шлюз
          </div>
          <div className={styles.contextMenuItem} onClick={() => changeElementType('bpmn:StartEvent')}>
            Старт
          </div>
          <div className={styles.contextMenuItem} onClick={() => changeElementType('bpmn:EndEvent')}>
            Конец
          </div>
        </div>
      )}
      
      {/* {selectedElement && (
        <div className={styles.renameModal}>
          <input
            type="text"
            value={elementName}
            onChange={(e) => setElementName(e.target.value)}
            placeholder="Введите название элемента"
          />
          <button onClick={updateElementName}>Сохранить</button>
        </div>
      )} */}
    </div>
  );
};