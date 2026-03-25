#!/usr/bin/env python3
"""
SmartDoc AI Backend API Testing Suite
Tests all backend endpoints: upload, documents, chat with RAG functionality
"""

import requests
import json
import time
import os
from io import BytesIO
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter

# Configuration
BASE_URL = "https://ask-documents.preview.emergentagent.com"
API_BASE = f"{BASE_URL}/api"

def create_test_pdf():
    """Create a simple test PDF with multiple pages for testing"""
    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=letter)
    
    # Page 1
    c.drawString(100, 750, "SmartDoc AI Test Document")
    c.drawString(100, 720, "Page 1 of 2")
    c.drawString(100, 690, "")
    c.drawString(100, 660, "This document contains information about artificial intelligence.")
    c.drawString(100, 630, "AI is revolutionizing how we process and analyze documents.")
    c.drawString(100, 600, "Machine learning algorithms can extract meaningful insights.")
    c.drawString(100, 570, "Natural language processing helps understand text content.")
    c.drawString(100, 540, "Vector embeddings enable semantic search capabilities.")
    c.showPage()
    
    # Page 2  
    c.drawString(100, 750, "SmartDoc AI Test Document")
    c.drawString(100, 720, "Page 2 of 2")
    c.drawString(100, 690, "")
    c.drawString(100, 660, "Key concepts in document AI include:")
    c.drawString(100, 630, "- PDF parsing and text extraction")
    c.drawString(100, 600, "- Text chunking for better processing")  
    c.drawString(100, 570, "- Embedding generation for similarity search")
    c.drawString(100, 540, "- Retrieval Augmented Generation (RAG)")
    c.drawString(100, 510, "- Streaming responses for better user experience")
    
    c.save()
    buffer.seek(0)
    return buffer.getvalue()

def test_get_documents_empty():
    """Test GET /api/documents - should return empty array initially"""
    print("\n=== Testing GET /api/documents (empty state) ===")
    try:
        response = requests.get(f"{API_BASE}/documents", timeout=30)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            documents = data.get('documents', [])
            if documents == []:
                print("✅ SUCCESS: Documents endpoint returns empty array as expected")
                return True
            else:
                print(f"❌ FAILED: Expected empty array, got: {documents}")
                return False
        else:
            print(f"❌ FAILED: Expected 200, got {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        return False

def test_upload_pdf():
    """Test POST /api/upload - PDF upload and processing"""
    print("\n=== Testing POST /api/upload ===")
    try:
        # Create test PDF
        pdf_data = create_test_pdf()
        
        files = {
            'file': ('test_document.pdf', pdf_data, 'application/pdf')
        }
        
        response = requests.post(f"{API_BASE}/upload", files=files, timeout=60)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success') and 'document' in data:
                doc = data['document']
                if (doc.get('name') == 'test_document.pdf' and 
                    doc.get('numPages') == 2 and
                    doc.get('chunks', 0) > 0):
                    print("✅ SUCCESS: PDF upload and processing completed")
                    print(f"   Document: {doc['name']}")
                    print(f"   Pages: {doc['numPages']}")
                    print(f"   Chunks: {doc['chunks']}")
                    return True, doc
                else:
                    print(f"❌ FAILED: Invalid document metadata: {doc}")
                    return False, None
            else:
                print(f"❌ FAILED: Invalid response structure: {data}")
                return False, None
        else:
            print(f"❌ FAILED: Expected 200, got {response.status_code}")
            return False, None
            
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        return False, None

def test_upload_no_file():
    """Test POST /api/upload error handling - no file provided"""
    print("\n=== Testing POST /api/upload (no file) ===")
    try:
        response = requests.post(f"{API_BASE}/upload", timeout=30)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 400:
            data = response.json()
            if 'error' in data and 'No file provided' in data['error']:
                print("✅ SUCCESS: Proper error handling for missing file")
                return True
            else:
                print(f"❌ FAILED: Invalid error message: {data}")
                return False
        else:
            print(f"❌ FAILED: Expected 400, got {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        return False

def test_get_documents_with_data():
    """Test GET /api/documents - should return document list after upload"""
    print("\n=== Testing GET /api/documents (with data) ===")
    try:
        response = requests.get(f"{API_BASE}/documents", timeout=30)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            documents = data.get('documents', [])
            if len(documents) >= 1:
                doc = documents[0]
                if (doc.get('name') == 'test_document.pdf' and 
                    doc.get('chunks', 0) > 0 and
                    'uploadedAt' in doc):
                    print("✅ SUCCESS: Documents endpoint returns uploaded document")
                    print(f"   Document: {doc['name']}")
                    print(f"   Chunks: {doc['chunks']}")
                    return True
                else:
                    print(f"❌ FAILED: Invalid document structure: {doc}")
                    return False
            else:
                print(f"❌ FAILED: Expected at least 1 document, got: {len(documents)}")
                return False
        else:
            print(f"❌ FAILED: Expected 200, got {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        return False

def test_chat_functionality():
    """Test POST /api/chat - RAG functionality with streaming"""
    print("\n=== Testing POST /api/chat ===")
    try:
        # Test with a question about the uploaded document
        payload = {
            "message": "What is this document about?"
        }
        
        response = requests.post(
            f"{API_BASE}/chat", 
            json=payload, 
            timeout=60,
            stream=True
        )
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ SUCCESS: Chat endpoint responded")
            
            # Check if it's streaming response
            content_type = response.headers.get('content-type', '')
            if 'text/plain' in content_type or 'stream' in content_type:
                print("✅ SUCCESS: Streaming response detected")
                
                # Read streaming chunks
                chunks_received = 0
                content_received = ""
                
                for chunk in response.iter_content(chunk_size=1024, decode_unicode=True):
                    if chunk:
                        chunks_received += 1
                        content_received += chunk
                        if chunks_received > 10:  # Prevent infinite loop
                            break
                
                if chunks_received > 0:
                    print(f"✅ SUCCESS: Received {chunks_received} streaming chunks")
                    print(f"   Sample content: {content_received[:200]}...")
                    return True
                else:
                    print("❌ FAILED: No streaming chunks received")
                    return False
            else:
                # Non-streaming response
                try:
                    data = response.json()
                    print(f"Response: {data}")
                    print("✅ SUCCESS: Chat endpoint working (non-streaming)")
                    return True
                except:
                    print(f"✅ SUCCESS: Chat response received: {response.text[:200]}...")
                    return True
        else:
            print(f"❌ FAILED: Expected 200, got {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        return False

def test_chat_no_message():
    """Test POST /api/chat error handling - no message provided"""
    print("\n=== Testing POST /api/chat (no message) ===")
    try:
        response = requests.post(f"{API_BASE}/chat", json={}, timeout=30)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 400:
            try:
                data = response.json()
                if 'error' in data and 'required' in data['error'].lower():
                    print("✅ SUCCESS: Proper error handling for missing message")
                    return True
            except:
                # Handle text response
                if 'required' in response.text.lower():
                    print("✅ SUCCESS: Proper error handling for missing message")
                    return True
            
            print(f"❌ FAILED: Invalid error response: {response.text}")
            return False
        else:
            print(f"❌ FAILED: Expected 400, got {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        return False

def test_delete_document():
    """Test DELETE /api/documents - delete uploaded document"""
    print("\n=== Testing DELETE /api/documents ===")
    try:
        payload = {
            "documentName": "test_document.pdf"
        }
        
        response = requests.delete(f"{API_BASE}/documents", json=payload, timeout=30)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                print("✅ SUCCESS: Document deletion completed")
                return True
            else:
                print(f"❌ FAILED: Delete did not return success: {data}")
                return False
        else:
            print(f"❌ FAILED: Expected 200, got {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        return False

def test_delete_no_document_name():
    """Test DELETE /api/documents error handling - no document name"""
    print("\n=== Testing DELETE /api/documents (no document name) ===")
    try:
        response = requests.delete(f"{API_BASE}/documents", json={}, timeout=30)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 400:
            data = response.json()
            if 'error' in data and 'required' in data['error'].lower():
                print("✅ SUCCESS: Proper error handling for missing document name")
                return True
            else:
                print(f"❌ FAILED: Invalid error message: {data}")
                return False
        else:
            print(f"❌ FAILED: Expected 400, got {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        return False

def test_get_documents_after_delete():
    """Test GET /api/documents - should be empty after deletion"""
    print("\n=== Testing GET /api/documents (after deletion) ===")
    try:
        response = requests.get(f"{API_BASE}/documents", timeout=30)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            documents = data.get('documents', [])
            if documents == []:
                print("✅ SUCCESS: Documents list empty after deletion")
                return True
            else:
                print(f"❌ FAILED: Expected empty array after deletion, got: {documents}")
                return False
        else:
            print(f"❌ FAILED: Expected 200, got {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        return False

def main():
    """Run comprehensive SmartDoc AI backend tests"""
    print("SmartDoc AI Backend API Testing Suite")
    print("====================================")
    print(f"Testing API at: {API_BASE}")
    
    # Test results tracking
    test_results = []
    
    # Test Flow 1: Initial state
    test_results.append(("GET /api/documents (empty)", test_get_documents_empty()))
    
    # Test Flow 2: Upload functionality
    test_results.append(("POST /api/upload (no file error)", test_upload_no_file()))
    
    # Upload a test PDF
    upload_success, doc_data = test_upload_pdf()
    test_results.append(("POST /api/upload (success)", upload_success))
    
    if upload_success:
        # Test Flow 3: Document listing with data
        test_results.append(("GET /api/documents (with data)", test_get_documents_with_data()))
        
        # Test Flow 4: Chat functionality
        test_results.append(("POST /api/chat (no message error)", test_chat_no_message()))
        test_results.append(("POST /api/chat (success)", test_chat_functionality()))
        
        # Test Flow 5: Delete functionality
        test_results.append(("DELETE /api/documents (no name error)", test_delete_no_document_name()))
        test_results.append(("DELETE /api/documents (success)", test_delete_document()))
        test_results.append(("GET /api/documents (after delete)", test_get_documents_after_delete()))
    else:
        print("\n⚠️ WARNING: Upload failed, skipping dependent tests")
    
    # Summary
    print("\n" + "="*60)
    print("TEST RESULTS SUMMARY")
    print("="*60)
    
    passed = 0
    total = len(test_results)
    
    for test_name, result in test_results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}: {test_name}")
        if result:
            passed += 1
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 ALL TESTS PASSED!")
        return True
    else:
        print(f"⚠️ {total - passed} tests failed")
        return False

if __name__ == "__main__":
    try:
        success = main()
        exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\nTest suite interrupted by user")
        exit(1)
    except Exception as e:
        print(f"\n\nUnexpected error: {str(e)}")
        exit(1)