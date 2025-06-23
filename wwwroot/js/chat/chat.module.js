// Chat Module para AngularJS
(function() {
    'use strict';
    
    angular.module('chatApp', [])
        .controller('ChatController', ChatController)
        .service('ChatService', ChatService)
        .directive('liaChat', LiaChatDirective);

    // Controlador principal del chat
    function ChatController($scope, ChatService, $timeout) {
        var vm = this;
        
        // Propiedades del controlador
        vm.isOpen = false;
        vm.showContacts = false;
        vm.contacts = [];
        vm.activeContact = null;
        vm.messages = [];
        vm.newMessage = '';
        vm.isTyping = false;
        
        // Métodos públicos
        vm.toggleChat = toggleChat;
        vm.toggleContacts = toggleContacts;
        vm.selectContact = selectContact;
        vm.sendMessage = sendMessage;
        vm.onKeyPress = onKeyPress;
        vm.getCurrentTime = getCurrentTime;
        
        // Inicialización
        init();
        
        function init() {
            vm.contacts = ChatService.getContacts();
            vm.activeContact = vm.contacts[0];
            loadMessages();
        }
        
        function toggleChat() {
            vm.isOpen = !vm.isOpen;
            if (!vm.isOpen) {
                vm.showContacts = false;
            }
        }
        
        function toggleContacts() {
            vm.showContacts = !vm.showContacts;
        }
        
        function selectContact(contact) {
            vm.activeContact = contact;
            vm.showContacts = false;
            loadMessages();
        }
        
        function loadMessages() {
            if (vm.activeContact) {
                vm.messages = ChatService.getMessages(vm.activeContact.id);
            }
        }
        
        function sendMessage() {
            if (!vm.newMessage.trim() || !vm.activeContact) return;
            
            var message = vm.newMessage.trim();
            vm.newMessage = '';
            vm.isTyping = true;
            
            ChatService.sendMessage(vm.activeContact.id, message)
                .then(function(response) {
                    loadMessages();
                })
                .catch(function(error) {
                    console.error('Error sending message:', error);
                })
                .finally(function() {
                    vm.isTyping = false;
                });
        }
        
        function onKeyPress(event) {
            if (event.keyCode === 13 && !event.shiftKey) {
                event.preventDefault();
                sendMessage();
            }
        }
        
        function getCurrentTime() {
            var now = new Date();
            var hours = now.getHours().toString().padStart(2, '0');
            var minutes = now.getMinutes().toString().padStart(2, '0');
            return 'Today at ' + hours + ':' + minutes;
        }
    }
    
    // Servicio para manejo de datos y comunicación
    function ChatService($http, $q, $timeout) {
        var service = this;
        var messages = {};
        
        var contacts = [
            {
                id: 'lia-soporte-cliente',
                name: 'Lia Soporte Cliente',
                description: 'Agente especializado en soporte y atención al cliente',
                avatar: 'https://mefiles.s3.us-east-1.amazonaws.com/LiaChatAzulFontoTransparente+(1).png',
                endpoint: '/api/chat/soporte-cliente',
                unreadCount: 2
            },
            {
                id: 'lia-operativa-cliente',
                name: 'Lia Operativa Cliente',
                description: 'Agente especializado en operaciones y procesos del cliente',
                avatar: 'https://www.microtech.es/hubfs/Fotos%20blog/retener_clientes.jpg',
                endpoint: '/api/chat/operativa-cliente'
            },
            {
                id: 'lia-soporte-despacho',
                name: 'Lia Soporte Despacho',
                description: 'Agente especializado en soporte interno del despacho',
                avatar: 'https://media.mykaramelli.com/galeria/articulos/decoracion-de-pared-escudo-hogwarts-61cm_12105_1.jpg',
                endpoint: '/api/chat/soporte-despacho',
                unreadCount: 3
            },
            {
                id: 'lia-operativa-despacho',
                name: 'Lia Operativa Despacho',
                description: 'Agente especializado en operaciones internas del despacho',
                avatar: 'https://mundoestadistico.com/wp-content/uploads/2023/11/Portada-1536x864.jpg',
                endpoint: '/api/chat/operativa-despacho',
                unreadCount: 2
            }
        ];
        
        // Inicializar mensajes de ejemplo
        initializeMessages();
        
        service.getContacts = getContacts;
        service.getContact = getContact;
        service.getMessages = getMessages;
        service.sendMessage = sendMessage;
        
        function initializeMessages() {
            messages = {
                'lia-soporte-cliente': [
                    { id: '1', text: '¡Hola! Necesito ayuda con mi cuenta 👋', type: 'user', timestamp: new Date() },
                    { id: '2', text: 'Hola, estaré encantada de ayudarte. ¿Qué problema tienes con tu cuenta?', type: 'agent', timestamp: new Date() }
                ],
                'lia-operativa-cliente': [
                    { id: '1', text: 'Hola, ¿podrías ayudarme con el proceso de facturación?', type: 'user', timestamp: new Date() }
                ],
                'lia-soporte-despacho': [
                    { id: '1', text: 'Buenas tardes, necesito soporte técnico interno', type: 'user', timestamp: new Date() }
                ],
                'lia-operativa-despacho': [
                    { id: '1', text: 'Hola, ¿cómo van las métricas operativas?', type: 'user', timestamp: new Date() }
                ]
            };
        }
        
        function getContacts() {
            return contacts;
        }
        
        function getContact(id) {
            return contacts.find(function(contact) {
                return contact.id === id;
            });
        }
        
        function getMessages(contactId) {
            return messages[contactId] || [];
        }
        
        function sendMessage(contactId, message) {
            var deferred = $q.defer();
            var contact = getContact(contactId);
            
            if (!contact) {
                deferred.reject('Contact not found');
                return deferred.promise;
            }
            
            // Agregar mensaje del usuario
            var userMessage = {
                id: Date.now().toString(),
                text: message,
                type: 'user',
                timestamp: new Date()
            };
            
            if (!messages[contactId]) {
                messages[contactId] = [];
            }
            messages[contactId].push(userMessage);
            
            // Enviar a la API .NET
            var requestData = {
                message: message,
                contactId: contactId,
                timestamp: new Date().toISOString()
            };
            
            $http.post(contact.endpoint, requestData)
                .then(function(response) {
                    // Simular delay de respuesta
                    $timeout(function() {
                        var agentMessage = {
                            id: (Date.now() + 1).toString(),
                            text: response.data.message || response.data,
                            type: 'agent',
                            timestamp: new Date()
                        };
                        messages[contactId].push(agentMessage);
                        deferred.resolve(response.data);
                    }, 1000);
                })
                .catch(function(error) {
                    console.error('Error calling API:', error);
                    
                    // Mensaje de error de fallback
                    $timeout(function() {
                        var errorMessage = {
                            id: (Date.now() + 1).toString(),
                            text: 'Lo siento, no pude procesar tu mensaje en este momento. Por favor, inténtalo de nuevo.',
                            type: 'agent',
                            timestamp: new Date()
                        };
                        messages[contactId].push(errorMessage);
                        deferred.reject(error);
                    }, 1000);
                });
            
            return deferred.promise;
        }
    }
    
    // Directiva para el componente de chat
    function LiaChatDirective() {
        return {
            restrict: 'E',
            templateUrl: '/templates/chat/chat-widget.html',
            controller: 'ChatController',
            controllerAs: 'chat',
            scope: {}
        };
    }
})();