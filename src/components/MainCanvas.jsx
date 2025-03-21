import React from 'react'
import { useEffect, useState, useRef } from 'react'
import styles from '../styles/maincanvas.module.css';
import BpmnViewer from 'bpmn-js/lib/Viewer';
import diagramXML from './diagram.xml';
export default function MainCanvas() {
  const containerRef = useRef(null);
  const viewerRef = useRef(null);
  const [xml, setXml] = useState(diagramXML);
  useEffect(() => {
    if (!viewerRef.current) {
      viewerRef.current = new BpmnViewer({
        container: containerRef.current
      });
    }
    
    const loadDiagram = async () => {
      try {
        await viewerRef.current.importXML(diagramXML);
        viewerRef.current.get('canvas').zoom('fit-viewport');
      } catch (err) {
        console.error('Error rendering BPMN:', err);
      }
    };

    if (diagramXML) loadDiagram();

    return () => {
      if (viewerRef.current) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
  }, [xml]);
  return <div ref={containerRef} style={{ height: '80%', width: '80%', border: '1px solid #ccc' }} />;
}


 