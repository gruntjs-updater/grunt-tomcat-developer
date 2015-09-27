<%@page contentType="text/plain" %>
<%
for( Object key : System.getProperties().keySet() ) {
%>
<%=key + " : " + System.getProperties().get(key)%>
<%
}
%>
