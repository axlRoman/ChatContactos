import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { ChatService } from '../../services/chat.service';
import { Contact, Message } from '../../models/chat.models';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;

  isOpen = false;
  showContacts = false;
  contacts: Contact[] = [];
  activeContact: Contact | null = null;
  messages: Message[] = [];
  newMessage = '';
  isTyping = false;
  
  private messagesSubscription?: Subscription;

  constructor(private chatService: ChatService) {}

  ngOnInit(): void {
    this.contacts = this.chatService.getContacts();
    this.activeContact = this.contacts[0];
    this.loadMessages();

    this.messagesSubscription = this.chatService.messages$.subscribe(allMessages => {
      if (this.activeContact) {
        this.messages = allMessages[this.activeContact.id] || [];
      }
    });
  }

  ngOnDestroy(): void {
    this.messagesSubscription?.unsubscribe();
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  toggleChat(): void {
    this.isOpen = !this.isOpen;
    if (!this.isOpen) {
      this.showContacts = false;
    }
  }

  toggleContacts(): void {
    this.showContacts = !this.showContacts;
  }

  selectContact(contact: Contact): void {
    this.activeContact = contact;
    this.showContacts = false;
    this.loadMessages();
  }

  private loadMessages(): void {
    if (this.activeContact) {
      this.messages = this.chatService.getMessages(this.activeContact.id);
    }
  }

  async sendMessage(): Promise<void> {
    if (!this.newMessage.trim() || !this.activeContact) return;

    const message = this.newMessage.trim();
    this.newMessage = '';
    this.isTyping = true;

    try {
      await this.chatService.sendMessage(this.activeContact.id, message);
    } finally {
      this.isTyping = false;
    }
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  private scrollToBottom(): void {
    if (this.messagesContainer) {
      const element = this.messagesContainer.nativeElement;
      element.scrollTop = element.scrollHeight;
    }
  }

  getCurrentTime(): string {
    const now = new Date();
    return `Today at ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  }
}
