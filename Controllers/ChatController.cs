using Microsoft.AspNetCore.Mvc;
using RestSharp;
using System.Text.Json;

namespace YourApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ChatController : ControllerBase
    {
        private readonly ILogger<ChatController> _logger;
        private readonly RestClient _restClient;

        // Configuración de endpoints de n8n
        private readonly Dictionary<string, string> _n8nEndpoints = new()
        {
            { "lia-soporte-cliente", "https://ai.mosses.mx/webhook/liamultiple" },
            { "lia-operativa-cliente", "https://ai.mosses.mx/webhook/liamultiple" },
            { "lia-soporte-despacho", "https://ai.mosses.mx/webhook/liamultiple" },
            { "lia-operativa-despacho", "https://ai.mosses.mx/webhook/liamultiple" }
        };

        public ChatController(ILogger<ChatController> logger)
        {
            _logger = logger;
            _restClient = new RestClient();
        }

        [HttpPost("soporte-cliente")]
        public async Task<IActionResult> SoporteCliente([FromBody] ChatRequest request)
        {
            return await ProcessChatMessage("lia-soporte-cliente", request);
        }

        [HttpPost("operativa-cliente")]
        public async Task<IActionResult> OperativaCliente([FromBody] ChatRequest request)
        {
            return await ProcessChatMessage("lia-operativa-cliente", request);
        }

        [HttpPost("soporte-despacho")]
        public async Task<IActionResult> SoporteDespacho([FromBody] ChatRequest request)
        {
            return await ProcessChatMessage("lia-soporte-despacho", request);
        }

        [HttpPost("operativa-despacho")]
        public async Task<IActionResult> OperativaDespacho([FromBody] ChatRequest request)
        {
            return await ProcessChatMessage("lia-operativa-despacho", request);
        }

        private async Task<IActionResult> ProcessChatMessage(string contactId, ChatRequest request)
        {
            try
            {
                if (!_n8nEndpoints.ContainsKey(contactId))
                {
                    return BadRequest(new { message = "Endpoint no encontrado", success = false });
                }

                var n8nEndpoint = _n8nEndpoints[contactId];
                
                // Crear la petición a n8n
                var restRequest = new RestRequest(n8nEndpoint, Method.Post);
                restRequest.AddJsonBody(new
                {
                    message = request.Message,
                    contactId = request.ContactId,
                    timestamp = request.Timestamp,
                    userId = GetUserId() // Método para obtener el ID del usuario actual
                });

                // Ejecutar la petición
                var response = await _restClient.ExecuteAsync(restRequest);

                if (response.IsSuccessful && !string.IsNullOrEmpty(response.Data))
                {
                    // Intentar deserializar la respuesta de n8n
                    try
                    {
                        var n8nResponse = JsonSerializer.Deserialize<N8nResponse>(response.Data);
                        return Ok(new ChatResponse
                        {
                            Message = n8nResponse?.Message ?? response.Data,
                            Success = true
                        });
                    }
                    catch (JsonException)
                    {
                        // Si no se puede deserializar, devolver el contenido como texto
                        return Ok(new ChatResponse
                        {
                            Message = response.Data,
                            Success = true
                        });
                    }
                }
                else
                {
                    _logger.LogError($"Error calling n8n endpoint: {response.ErrorMessage}");
                    return Ok(new ChatResponse
                    {
                        Message = "Lo siento, no pude procesar tu mensaje en este momento. Por favor, inténtalo de nuevo.",
                        Success = false
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error processing chat message for contact {contactId}");
                return Ok(new ChatResponse
                {
                    Message = "Ha ocurrido un error interno. Por favor, inténtalo de nuevo más tarde.",
                    Success = false
                });
            }
        }

        private string GetUserId()
        {
            // Implementar lógica para obtener el ID del usuario actual
            // Por ejemplo, desde el token JWT, sesión, etc.
            return User?.Identity?.Name ?? "anonymous";
        }
    }

    public class ChatRequest
    {
        public string Message { get; set; } = string.Empty;
        public string ContactId { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
    }

    public class ChatResponse
    {
        public string Message { get; set; } = string.Empty;
        public bool Success { get; set; }
    }

    public class N8nResponse
    {
        public string Message { get; set; } = string.Empty;
        public bool Success { get; set; }
        public object? Data { get; set; }
    }
}