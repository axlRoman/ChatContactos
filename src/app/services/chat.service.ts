import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { Message, Contact, ChatResponse } from '../models/chat.models';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private messagesSubject = new BehaviorSubject<{ [contactId: string]: Message[] }>({});
  public messages$ = this.messagesSubject.asObservable();

  private contacts: Contact[] = [
    {
      id: 'stark',
      name: 'Lia Legal Despacho',
      description: 'Agente Especializado en Derecho Laboral',
      avatar: 'https://mefiles.s3.us-east-1.amazonaws.com/LiaChatAzulFontoTransparente+(1).png',
      endpoint: 'https://ai.mosses.mx/webhook/liamultiple',
    },
    {
      id: 'banner',
      name: 'Lia Operativa Despacho',
      description: 'Agente especializado en métricas y análisis de datos',
      avatar: 'https://mundoestadistico.com/wp-content/uploads/2023/11/Portada-1536x864.jpg',
      endpoint: 'https://ai.mosses.mx/webhook/liamultiple',
    },
    {
      id: 'thor',
      name: 'Lia Legal Cliente',
      description: 'Agente especializado en derecho civil',
      avatar: 'https://media.mykaramelli.com/galeria/articulos/decoracion-de-pared-escudo-hogwarts-61cm_12105_1.jpg',
      endpoint: 'https://ai.mosses.mx/webhook/liamultiple',
    },
    {
      id: 'danvers',
      name: 'Lia Operativa Cliente',
      description: 'Agente especializado en marketing y ventas',
      avatar: 'https://www.microtech.es/hubfs/Fotos%20blog/retener_clientes.jpg',
      endpoint: 'https://ai.mosses.mx/webhook/liamultiple',
    }
  ];

  constructor(private http: HttpClient) {
    //this.initializeMessages();
  }
/*
  private initializeMessages(): void {
    const initialMessages: { [contactId: string]: Message[] } = {
      stark: [
        {
          id: '1',
          text: '¡Hola! ¿Podrías explicarme sobre la nueva reforma fiscal? 👋',
          type: 'user',
          timestamp: new Date()
        },
        {
          id: '2',
          text: 'Buenos días, claro que sí. ¿Qué aspectos específicos te gustaría conocer?',
          type: 'agent',
          timestamp: new Date()
        }
      ],
      banner: [
        {
          id: '1',
          text: 'Hola, ¿podrías mostrarme las métricas del último trimestre?',
          type: 'user',
          timestamp: new Date()
        }
      ],
      thor: [
        {
          id: '1',
          text: 'Buenas tardes, necesito asesoría sobre un contrato',
          type: 'user',
          timestamp: new Date()
        }
      ],
      danvers: [
        {
          id: '1',
          text: 'Hola, ¿cómo va la estrategia de marketing?',
          type: 'user',
          timestamp: new Date()
        }
      ]
    };

    this.messagesSubject.next(initialMessages);
  }
    */

  getContacts(): Contact[] {
    return this.contacts;
  }

  getContact(id: string): Contact | undefined {
    return this.contacts.find(contact => contact.id === id);
  }

  getMessages(contactId: string): Message[] {
    const allMessages = this.messagesSubject.value;
    return allMessages[contactId] || [];
  }

  async sendMessage(contactId: string, message: string): Promise<void> {
    const contact = this.getContact(contactId);
    if (!contact) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: message,
      type: 'user',
      timestamp: new Date()
    };

    this.addMessage(contactId, userMessage);

    try {
      // Send to n8n endpoint
      const response = await this.http.post<ChatResponse>(contact.endpoint, {
        user: 123,
        regimen: 605,
        plataforma: 'me',
        message: message,
        mes: new Date().getMonth() + 1,
        nombreMes: new Date().toLocaleString('es-ES', { month: 'long' }),
        anio: new Date().getFullYear(),
        ultimoDia: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate(),
        timestamp: new Date().toISOString(),
        sender: 'user'
      }).toPromise();

      // Add agent response
      if (response && response.success) {
        const agentMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: response.response,
          type: 'agent',
          timestamp: new Date()
        };

        setTimeout(() => {
          this.addMessage(contactId, agentMessage);
        }, 1000); // Simulate typing delay
      }
    } catch (error) {
      console.error('Error sending message to n8n:', error);
      
      // Fallback response
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Lo siento, no pude procesar tu mensaje en este momento. Por favor, inténtalo de nuevo.',
        type: 'agent',
        timestamp: new Date()
      };

      setTimeout(() => {
        this.addMessage(contactId, errorMessage);
      }, 1000);
    }
  }

  private addMessage(contactId: string, message: Message): void {
    const currentMessages = this.messagesSubject.value;
    const contactMessages = currentMessages[contactId] || [];
    
    currentMessages[contactId] = [...contactMessages, message];
    this.messagesSubject.next({ ...currentMessages });
  }
}