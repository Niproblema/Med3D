#version 300 es
precision mediump float;

uniform mat4 MVMat; // Model View Matrix
uniform mat4 PMat;  // Projection Matrix
uniform mat3 NMat;  // Normal Matrix

in vec3 VPos;       // Vertex position
in vec3 VNorm;      // Vertex normal

#if (TEXTURE)
    in vec2 uv;          // Texture coordinate
#fi

// Output transformed vertex position, normal and texture coordinate
out vec3 fragVPos;
out vec4 texPos;
out vec3 fragVNorm;
out vec2 fragUV;

void main() {
    // Model view position
    vec4 VPos4 = MVMat * vec4(VPos, 1.0);
    texPos = PMat * VPos4;
    texPos = vec4(texPos.xyz / abs(texPos.w), 1);

    // Projected position
    gl_Position = texPos;
    fragVPos = vec3(VPos4) / VPos4.w;

    // Transform normal
    fragVNorm = vec3(NMat * VNorm);
}